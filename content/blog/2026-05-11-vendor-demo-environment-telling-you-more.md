---
title: "Your Vendor's Demo Environment Is Telling You More Than Their Sales Deck"
date: 2026-05-11
draft: true
pillar: "The Constellation"
tags: []
linkedin_copy: |
  A vendor's marketing site lists six platform integrations. Their API schema defines an integration type enum with two values.
  
  That is not six integrations. That is two first-class integrations and four that live somewhere else: a partner connector, a tenant-specific extension, or a line item on a services contract. The difference between those tiers is the difference between a two-week connector setup and a three-month custom build. The sales deck treats them identically.
  
  I have done pre-contract technical reviews where thirty minutes with a vendor's public API spec revealed more about integration reality than the entire sales process. Endpoint counts by module tell you where the vendor spent their engineering time. The integration data model tells you which platforms have dedicated types and which are handled through workarounds. Demo environment behavior tells you how mature the developer experience actually is.
  
  None of this is secret. The Swagger doc is often sitting on a subdomain. The demo environment is publicly accessible. The package namespaces are on Packagist or npm. These artifacts are not curated for sales. They are the thing the engineering team actually built, exposed as-is.
  
  Mid-market merchants almost never look at any of this before signing. The people evaluating the vendor are business stakeholders working from decks, demos, and reference calls. All curated. The technical artifacts are the most honest document in the sales process. They just require someone who knows how to read them.
  
  This is where an independent technical review before the contract earns its fee. Not finding problems with the vendor. Finding the gap between what "supported" means on the features slide and what it means in the API schema. That gap is where integration surprises live, and they get expensive fast.
  
  Full post: {{url}}
---

Every vendor in the commerce constellation has a sales deck. It has a features slide. It has a logo wall of integrations. It has a diagram with arrows connecting boxes that says "platform + OMS + CDP + ESP" and makes it look like everything talks to everything.

The sales deck is not lying. It is just not telling you the thing you need to know.

The thing you need to know is: what did they actually build, and how does it actually connect? That answer is not in the deck. It is in the vendor's own technical artifacts. Their API spec. Their demo environment. Their public package namespaces. Their integration schema. These things are often publicly available, and almost no merchant looks at them before signing.

Here is what I mean concretely.

A vendor's marketing site lists six platform integrations. Their API schema defines an integration type enum with two values. That is not six integrations. That is two first-class integrations and four that are handled through some other path: a plugin, a partner connector, a customer-specific extension, or a line item on a services contract. The difference matters enormously when you are scoping an implementation. A first-class integration has a data model, dedicated API routes, probably automated setup. A partner connector means you are buying two things and hoping they work together. A services-contract integration means you are paying someone to build it from scratch and calling it "supported."

You can see this before you sign. The API spec is often public. The Swagger or OpenAPI doc is sitting on a subdomain. The integration model in the schema tells you exactly which platforms have dedicated types and which do not. A thirty-minute technical review of these artifacts will tell you more about integration reality than a sixty-minute sales demo.

Demo environments reveal similar patterns. How the login works tells you something about the auth architecture. Whether the API routes return structured errors or generic redirects tells you how mature the developer experience is. Whether the demo instance shares the same API contract as the production instance, or whether it is running a stripped-down version, tells you how representative the demo actually is.

I once reviewed a vendor's public API surface and found 187 endpoints organized into 42 modules. The marketing site emphasized five or six capabilities. The API told a different story. Fulfillment had 27 endpoints. Products had 22. The module the merchant cared most about had 6. That ratio tells you where the vendor invested their engineering time. It is not a criticism. It is information. And it is information the merchant should have before the contract is signed, not after.

The same review revealed that the integration type enum in the data model listed two platforms explicitly. The marketing site listed five. Two of the remaining three showed up as tenant-specific routes on individual customer environments but not in the shared platform code. The fifth had a marketing page but no visible API evidence at all. Each of those three tiers represents a different level of implementation risk, integration cost, and ongoing maintenance burden. The sales deck treats them identically.

This is not about catching vendors in a lie. Most vendors are describing their product honestly at the capabilities level. They can integrate with those platforms. The question is how. And "how" is the difference between a two-week connector setup and a three-month custom build.

Merchants in the mid-market rarely have the technical staff to do this kind of pre-contract review. The people evaluating the vendor are business stakeholders, maybe a director of ecommerce, maybe a VP of operations. They evaluate based on the materials the vendor provides: the deck, the demo walkthrough, the reference calls. All of those are curated. The technical artifacts are not curated. They are the thing the engineering team actually built, exposed as-is.

This is one of the places where an independent technical advisor earns their fee before the project even starts. Not during implementation. Before the contract. Someone who knows how to read an API spec, who understands what an integration type enum means in practice, who can look at a demo environment and tell you whether the thing you are buying matches the thing that exists.

The pre-contract technical review is the cheapest insurance in commerce. It costs a few hours of expert time. It can save months of integration surprises. And it starts with a simple habit: before you believe the features slide, go read the API.

The vendor's own technical artifacts are the most honest document in the sales process. They just require someone who knows how to read them.