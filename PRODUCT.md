# BetterMarmo

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Assumption for this session: Firefox WebExtension, plain JavaScript and CSS. No runtime dependencies. User preference question is pending.

## Users
Inferred from the brief: University of Waterloo students using Marmoset to submit programming assignments and inspect feedback.

## Product Purpose
Redesign https://marmoset.student.cs.uwaterloo.ca/ with a modern, clean interface through a Firefox extension.

## Capabilities and Constraints
Preserve original content, URLs, forms, hidden inputs, authentication, and submission semantics. Restrict extension access to the specified HTTPS host. No analytics or external requests. User-requested update: show latest submission results on the project list via read-only same-origin history/result requests. Empty histories say Not submitted; pending/error states remain distinct. Local settings only. The signed-in Waterloo DOM is unavailable; compatibility is based on upstream JSP templates and must be verified on a signed-in deployment.

## Brand Commitments
Modern, clean UI/UX. User-confirmed update: black and white, using Composio’s design language. Full visible desktop table columns and readable mobile fields are required. BetterMarmo is an independent extension.

## Evidence on Hand
Empty starting repository. Upstream course, project, submission and upload templates from https://github.com/squished18/marmoset_ECE_base/tree/master/SubmitServer/trunk/SubmitServer2/WebRoot. Waterloo course workflow documentation at https://student.cs.uwaterloo.ca/~cs240e/w26/resources.phtml. Local preview data is illustrative.

## Product Principles
Preserve working academic workflows. Make dense content easy to scan. Keep enhancements reversible. Never infer grades or submission success.
