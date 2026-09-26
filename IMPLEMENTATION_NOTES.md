# Implementation Notes

## 1. What I changed

#### Task 0: Explored the code, and wrote the description that's here in the section 2 of this file.

#### Task 1: Fixed the two failing tests from their root causes, and here are the details:

- The failing one in the diff computation was because of that the diff computation detects the change only depending on the unit price. It has been updated to consider the quantity as well.
- The other one in the CR Detail Component was failing because the approve function in the component class wasn't respect the approve permission policy. It has been updated to respect it.

#### Task 2: Implemented the status filter for the CRs in the CR List Component.

#### Task 3: Implemented the approval and the rejection logic for the CR, with enahancements on the CR Detail Component as the following details:

- Made the timeline list for the CR appears in chronological order.
- Added validation on the reject reason control, to enforce it's neither empty nor contains only white-sapces.
- Update the `canReject` function in the CR Detail Componet to make it respect the permissions and the policy like the `canApprove` one.
- Implemented the functionality for the approve and the reject functions, and made them call the APIs for the rejection and the approval.
- Enhanced the display for the UI elements in the operations section in CR Detail Component, and made them more matchers with the state.

#### Task 4: Add an element to show the submitting state in the operations section in the CR Detail Component.

#### Task 5: Add tests corresponding to the testing strategy, which is clarified in the section 4 of this file.

-

## 2. Component & state model

For Task 0:
The app contains a single screen for Change Requests(CRs) reviews and operations. This screen gives possibility for acting in three modes: approver, reviewer, and org mode.
This screen contains two components: one is for listing the CRs, with possibility to filter them by the CR status (which is not implemented yet in the first version of the app), and the other component is for viewing one CR, and approve or reject it (which are operations aren't supported yet in the first version of the app).
Both of the components fetches the data from mock APIs, which mock fetching the data from a real backend source, and both of the components has the possibility to be in the states of idle/loading/loaded/error states, as they are fetching from real API, and there's possibility in them to mock the latency and the error.
The mock APIs fetches data from the `fixtures.ts` file, which contains hard-coded data, and the APIs store and perform the operations on the data in memory.

-

## 3. Invariants I keep

| Invariant       | How / where                                                          |
| --------------- | -------------------------------------------------------------------- |
| View States     | In both of the CR components, as they are wired correctly - Task 2   |
| Approval Policy | It respects permissions correctly, in the permissions utils - Task 4 |

## 4. Testing strategy

For the pure methods, I wrote pure functions tests, and applied multiple inputs on them with multiple cases. That applies to all of the utils of diff computation, permissions, and money formatting utils.

For the components, they have been tested in DOM and with rendering inside Component Fixtures. For each topic of the logic, one test suite has been created, with multiple happy and unhappy paths. That applies to both of CR Detail component, and CR List Component.
For example, as it can be seen in the CR Detail component spec file, there are separated test suites for the approval, the rejection, the timeline ordering,....., and each of these suites contains multiple cases for this logic.

I also thought about adding e2e tests using PlayWright, but I realized that's meaning-less for this application, as the application doesn't give any chance for data seeding in the e2e running.

-

## 5. Assumptions

- The CR selection doesn't work, I kept it not working, as nothing in the requirements states that it should work.
- The change detection in the diff computation doesn't consider the description variance as a change. I kept it not considering it, as no clear thing in the requirements asks to make it consider it as a change.
- In the state filters, when the filter keeps no rows in the table, the page shows an empty table, instead of showing a message clarifies that no rows is there. That's because in the current implementation, when the filters keep no rows, we are in the loaded state, and the message shown in the empty state. I prefered keeping it like this, as the empty state looks like no data at all, not only with the filter. As it seems the states represents the status of the communication with the API.
- Added a message clarifies that we are in the submitting state in the operations section in the CR Detail Component.
-

## 6. Where I used AI

For applications like this, I usually use Codex, or Claude Code, but while solving this assignement, unfortunately, I was out of tokens in both, so I used ChatGPT instead.
As the GitHub repo is public, I was asking ChatGPT to access it by the link, and I was giving it detailed instructions to suggest me the changes, and I was copy/paste them in the local repo.
I also used it to write me the tests from my testing strategy. And I asked it to help me in understanding some lines of the code.

-

## 7. What I'd improve with more time

- Implement the CR selection, and make it works.
- Create Angular services to work with the CRs, and move the logic and the API calls from the components classes to them. That makes the logic more reusable across components, more testable, more replacable, and less error-brone.
- Use enums instead of the hard-coded strings for the view states, and the CR statuses, that increases the reusability, the readability, and the type-safety,
- Enhancing the tests by creating fixture for each test suite, instead of using the common fixtures.
-
