# Contributing

Thanks for taking an interest. This list is small on purpose, so a good suggestion is one that a careful reader would be glad to have found.

## What belongs

- A **primary source** (a law, a standard, a regulator's guidance, a framework from its author) or an **open-source tool** that is maintained and documented.
- Something you have opened and read, not something you have only heard of.
- One entry per resource, with a neutral description of what it is.

## What does not belong

- Blog posts, newsletters, courses, vendor products, paid tools or anything with a referral link.
- Ratings, rankings or adjectives such as "best" or "powerful".
- Resources that are not about governing, securing, testing or documenting AI.

## How to add an entry

1. Add one object to `data/resources.json` with `category`, `name`, `url` and `description`.
2. The description is one sentence, 20 to 140 characters, that ends with a full stop.
3. Run `node scripts/build.mjs` to regenerate `README.md`, then `node --test`.
4. Run `node scripts/check-links.mjs` and say in the pull request if the link is reported as blocked.
5. Open a pull request. Explain in a sentence why the resource earns a place.

## Ground rules

- **No dependencies.** Scripts use Node 18 or later and `node:test`.
- **Do not edit `README.md` by hand.** A test fails if it differs from the generated version.
- **British English, plain tone, no long dashes.** A test fails if an em dash or en dash appears in a text file.
- **Be honest about the maintainer.** The "By the maintainer" section stays last and at most a quarter of the list.
