# Implementation Notes

> Fill this in as part of your submission. 1–2 pages, bullet points are fine. Delete these
> instructions before submitting.

## 1. What I changed

<!-- Grouped by task: bugs fixed and features implemented (component + template). -->

-

## 2. Component & state model

For Task 0:
The app contains a single screen for Change Requests(CRs) reviews and operations. This screen gives possibility for acting in three modes: approver, reviewer, and org mode.
This screen contains two components: one is for listing the CRs, with possibility to filter them by the CR status (which is not implemented yet in the first version of the app), and the other component is for viewing one CR, and approve or reject it (which are operations aren't supported yet in the first version of the app).
Both of the components fetches the data from mock APIs, which mock fetching the data from a real backend source, and both of the components has the possibility to be in the states of idle/loading/loaded/error states, as they are fetching from real API, and there's possibility in them to mock the latency and the error.
The mock APIs fetches data from the `fixtures.ts` file, which contains hard-coded data, and the APIs store and perform the operations on the data in memory.

-

## 3. Invariants I keep

<!-- Which properties the UI guarantees, and where in the component/template each is enforced. -->

| Invariant | How / where |
| --------- | ----------- |

## 4. Testing strategy

<!-- What you tested (component/DOM vs pure) and why; what you deliberately skipped given the budget. -->

-

## 5. Assumptions

<!-- Where the requirements left room for interpretation, the calls you made and why. -->

-

## 6. Where I used AI

-

## 7. What I'd improve with more time

-
