<!-- 1804b910-a042-4934-9a65-566b58855a47 fcd1f4da-1162-4fb1-876d-96c5d757188b -->
# Fix AI Command Issues - Phase 2: Diagnose

## Status: Logging Complete ✓

Comprehensive logging has been added to:

- ✅ `src/components/Chat/ChatBox.tsx` - AI responses, commands, and errors
- ✅ `src/hooks/useCanvasCommands.ts` - Manipulation actions, selectors, and updates
- ✅ `src/utils/helpers.ts` - Shape selection logic

## Next Steps: Test & Diagnose

### Step 1: Review Console Logs

**Testing Instructions:**

1. Open browser console (F12 or right-click → Inspect → Console)
2. Create test shapes using AI chatbot:

- "create a circle"
- "create a rectangle"

3. Try manipulation commands that are failing:

- "rotate circle #1 90 degrees"
- "move rectangle #1 to position 100, 100"
- "resize circle #1 to radius 80"

4. Review console output to identify where the failure occurs

**What to Look For:**

- `[ChatBox] AI Response:` - Check if selector has `shapeNumber` and `shapeType`
- `[useCanvasCommands] Selector:` - Verify selector values are correct
- `[selectShapeByTypeAndNumber]` - Check if shapes are found
- `[useCanvasCommands] Applying updates:` - Verify updates object
- Any error messages in red

### Step 2: Replan Based on Findings

Once we review the console logs, we'll create a targeted plan to fix the specific issue:

**Possible Scenarios:**

**Scenario A: AI not generating proper selector**

- Symptom: `selector` is undefined or missing `shapeNumber`/`shapeType`
- Root cause: Firebase function system prompt needs update or redeployment
- Fix: Redeploy `functions/src/index.ts` or update AI prompt

**Scenario B: Shape selection failing**

- Symptom: `selectShapeByTypeAndNumber` returns null despite shapes existing
- Root cause: Type mapping issue (e.g., "rectangle" vs "rect")
- Fix: Update type mapping or shape numbering logic

**Scenario C: Update not applying**

- Symptom: Update object looks correct but shape doesn't change
- Root cause: Firestore update failing or not persisting
- Fix: Debug `updateShape` function in `useShapes.ts`

**Scenario D: Other issue**

- Review specific error and create targeted fix

## Action Required

**User should:**

1. Test the commands with console open
2. Share what the console logs show (copy/paste or screenshot)
3. We'll then create a specific fix plan based on the actual issue

This approach ensures we fix the real problem instead of guessing.

### To-dos

- [ ] Add comprehensive console logging to ChatBox.tsx to display AI responses and errors
- [ ] Add detailed logging to useCanvasCommands.ts manipulation action handler
- [ ] Add logging to selectShapeByTypeAndNumber in helpers.ts
- [ ] Check if Firebase function source needs to be redeployed
- [ ] Test the commands with logging and fix any identified issues