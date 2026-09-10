import {
  collectDailySnapshot,
  failAgentRun,
  finishAgentRun,
  learnFromDailySnapshot,
  runGoalManagedPublishing,
} from "./daily-manager-steps";
import { notifyGoogleIndexing } from "./google-indexing";

export async function dailySiteManagerWorkflow(agentRunId: string) {
  "use workflow";
  try {
    const snapshot = await collectDailySnapshot(agentRunId);
    const learning = await learnFromDailySnapshot(agentRunId, snapshot.dateKey);
    const publishing = [];
    // Four bounded passes can discover twelve never-run sources (three per pass), enough to
    // inspect a newly-added batch of eleven without relaxing the daily publication limit.
    for (let cycle = 1; cycle <= 4; cycle += 1) {
      const result = await runGoalManagedPublishing(agentRunId, cycle);
      publishing.push(result);
      if (result.skipped || (result.sourcesChecked === 0 && result.processed === 0)) break;
    }
    const indexing = await notifyGoogleIndexing(agentRunId);
    return await finishAgentRun(agentRunId, snapshot.dateKey, learning, publishing, indexing);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await failAgentRun(agentRunId, message);
    throw error;
  }
}
