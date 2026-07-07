#!/usr/bin/env python3
"""Sync FutureHax Lemon Squeezy test catalog: validate products/webhooks and print env vars."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

STORE_ID = "401837"
STORE_SLUG = "futurehax"

CATALOG = {
    "Alpha-5 Professional": {
        "env": "NEXT_PUBLIC_LS_VARIANT_PROFESSIONAL",
        "app": "alpha-5",
        "price_cents": 500,
    },
    "Alpha-5 Premium": {
        "env": "NEXT_PUBLIC_LS_VARIANT_PREMIUM",
        "app": "alpha-5",
        "price_cents": 1000,
    },
    "MCG Full Access": {
        "env": "NEXT_PUBLIC_LS_FULL_ACCESS_VARIANT",
        "app": "mcg",
        "price_cents": 1499,
    },
    "MCG AI Tokens 40": {
        "env": "NEXT_PUBLIC_LS_TOKENS_40_VARIANT",
        "app": "mcg",
        "price_cents": 99,
    },
    "MCG AI Tokens 125": {
        "env": "NEXT_PUBLIC_LS_TOKENS_125_VARIANT",
        "app": "mcg",
        "price_cents": 299,
    },
    "MCG AI Tokens 300": {
        "env": "NEXT_PUBLIC_LS_TOKENS_300_VARIANT",
        "app": "mcg",
        "price_cents": 599,
    },
}

WEBHOOKS = {
    "mcg": {
        "url": "https://monster-cards.futurehax.com/api/webhooks/lemonsqueezy",
        "events": {"order_created"},
    },
    "alpha5": {
        "url": "https://alpha-5.app/api/webhooks/lemonsqueezy",
        "events": {
            "subscription_created",
            "subscription_updated",
            "subscription_cancelled",
            "subscription_expired",
        },
    },
}


def api_key() -> str:
    key = os.environ.get("LEMONSQUEEZY_TEST_API_KEY") or os.environ.get("LEMONSQUEEZY_API_KEY")
    if not key:
        sys.exit("Set LEMONSQUEEZY_TEST_API_KEY or LEMONSQUEEZY_API_KEY")
    return key


def ls_get(path: str, params: dict | None = None) -> dict:
    url = f"https://api.lemonsqueezy.com/v1/{path}"
    if params:
        url += "?" + urllib.parse.urlencode(params, doseq=True)
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.api+json",
            "Authorization": f"Bearer {api_key()}",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def list_all(path: str, params: dict) -> list[dict]:
    page = 1
    items: list[dict] = []
    while True:
        data = ls_get(path, {**params, "page[number]": page, "page[size]": 50})
        items.extend(data.get("data") or [])
        meta = data.get("meta", {}).get("page", {})
        if page >= meta.get("lastPage", 1):
            break
        page += 1
    return items


def main() -> int:
    products = list_all("products", {"filter[store_id]": STORE_ID})
    webhooks = list_all("webhooks", {"filter[store_id]": STORE_ID})

    by_name: dict[str, dict] = {}
    for product in products:
        name = product["attributes"]["name"]
        by_name[name] = product

    missing = [name for name in CATALOG if name not in by_name]
    if missing:
        print("Missing products (create in LS dashboard, test mode):", file=sys.stderr)
        for name in missing:
            spec = CATALOG[name]
            print(
                f"  - {name}: ${spec['price_cents'] / 100:.2f} ({spec['app']})",
                file=sys.stderr,
            )
        print(
            f"\nDashboard: https://app.lemonsqueezy.com/stores/{STORE_ID}/products",
            file=sys.stderr,
        )

    print(f"NEXT_PUBLIC_LS_STORE={STORE_SLUG}")
    print()

    variant_ok = True
    for name, spec in CATALOG.items():
        product = by_name.get(name)
        if not product:
            print(f"# {spec['env']}=  # missing product: {name}")
            variant_ok = False
            continue
        product_id = product["id"]
        variants = list_all("variants", {"filter[product_id]": product_id})
        if not variants:
            print(f"# {spec['env']}=  # no variants for {name}")
            variant_ok = False
            continue
        variant = variants[0]
        vid = variant["id"]
        price = variant["attributes"].get("price")
        if price is not None and int(price) != spec["price_cents"]:
            print(
                f"# WARNING: {name} price is {int(price)} cents, expected {spec['price_cents']}",
                file=sys.stderr,
            )
        print(f"{spec['env']}={vid}")

    print("\n# Webhooks")
    wh_ok = True
    for label, expected in WEBHOOKS.items():
        match = [
            w
            for w in webhooks
            if w["attributes"]["url"] == expected["url"]
            and set(w["attributes"]["events"]) == expected["events"]
        ]
        if match:
            print(f"# {label}: id={match[0]['id']} test_mode={match[0]['attributes']['test_mode']}")
        else:
            print(f"# MISSING webhook: {label} -> {expected['url']}", file=sys.stderr)
            wh_ok = False

    if missing or not variant_ok or not wh_ok:
        return 1
    print("\n# Catalog complete.", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
