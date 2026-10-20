
# Build Emergency Turn Swap

## User experience
- Add a two-step Request Swap dialog to a group's member and admin dashboards: enter a reason, then choose an eligible group member.
- Only offer members with an upcoming payout slot that has not been paid; the database independently validates both users' turns.
- Show incoming requests as prominent dashboard notifications with Accept and Decline actions.
- On acceptance, atomically exchange the two upcoming schedule assignees and mark both turns as swapped; show a Swapped badge in each payout timeline.

## Security and implementation
- Add a payout-swap requests table with participant-only read access and explicit authenticated/service-role grants.
- Keep request creation and response writes behind security-definer database functions that verify caller identity, group membership, pending status, unpaid upcoming schedule rows, and serialize competing responses.
- Add client hooks for candidate selection, incoming request queries, mutations, and a realtime subscription with cleanup on unmount.
- Integrate the dialog into both group dashboard views and a global incoming-request inbox so requests remain visible across navigation.

## Validation
- Verify eligible-member filtering and no-candidate states, authorization and schedule checks in the database functions, request notifications, accept/decline, swapped badges, and realtime listener cleanup.

