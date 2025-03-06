import { composePrompt } from "../prompts";
import logger from "../logger";
import { booleanFooter } from "../prompts";
import {
  type Action,
  type ActionExample,
  type HandlerCallback,
  type IAgentRuntime,
  type Memory,
  ModelTypes,
  type State,
} from "../types";

export const shouldUnmuteTemplate = `# Task: Decide if {{agentName}} should unmute this previously muted room and start considering it for responses again.

{{recentMessages}}

Should {{agentName}} unmute this previously muted room and start considering it for responses again?
Respond with YES if:
- The user has explicitly asked {{agentName}} to start responding again
- The user seems to want to re-engage with {{agentName}} in a respectful manner
- The tone of the conversation has improved and {{agentName}}'s input would be welcome

Otherwise, respond with NO.
${booleanFooter}`;

export const unmuteRoomAction: Action = {
  name: "UNMUTE_ROOM",
  similes: [
    "UNMUTE_CHAT",
    "UNMUTE_CONVERSATION",
    "UNMUTE_ROOM",
    "UNMUTE_THREAD",
  ],
  description:
    "Unmutes a room, allowing the agent to consider responding to messages again.",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const roomId = message.roomId;
    const roomState = await runtime.databaseAdapter.getParticipantUserState(
      roomId,
      runtime.agentId
    );
    return roomState === "MUTED";
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    _options?: { [key: string]: unknown },
    _callback?: HandlerCallback,
    _responses?: Memory[]
  ) => {
    async function _shouldUnmute(state: State): Promise<boolean> {
      const shouldUnmutePrompt = composePrompt({
        state,
        template: shouldUnmuteTemplate, // Define this template separately
      });

      const response = await runtime.useModel(ModelTypes.TEXT_SMALL, {
        runtime,
        prompt: shouldUnmutePrompt,
        stopSequences: [],
      });

      const cleanedResponse = response.trim().toLowerCase();

      // Handle various affirmative responses
      if (
        cleanedResponse === "true" ||
        cleanedResponse === "yes" ||
        cleanedResponse === "y" ||
        cleanedResponse.includes("true") ||
        cleanedResponse.includes("yes")
      ) {
        await runtime.getMemoryManager("messages").createMemory({
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: message.content.source,
            thought:
              "I will now unmute this room and start considering it for responses again",
            actions: ["UNMUTE_ROOM_STARTED"],
          },
          metadata: {
            type: "UNMUTE_ROOM",
          },
        });
        return true;
      }

      // Handle various negative responses
      if (
        cleanedResponse === "false" ||
        cleanedResponse === "no" ||
        cleanedResponse === "n" ||
        cleanedResponse.includes("false") ||
        cleanedResponse.includes("no")
      ) {
        await runtime.getMemoryManager("messages").createMemory({
          entityId: message.entityId,
          agentId: message.agentId,
          roomId: message.roomId,
          content: {
            source: message.content.source,
            thought: "I tried to unmute a room but I decided not to",
            actions: ["UNMUTE_ROOM_FAILED"],
          },
          metadata: {
            type: "UNMUTE_ROOM",
          },
        });
        return false;
      }

      // Default to false if response is unclear
      logger.warn(`Unclear boolean response: ${response}, defaulting to false`);
      return false;
    }

    if (await _shouldUnmute(state)) {
      await runtime.databaseAdapter.setParticipantUserState(
        message.roomId,
        runtime.agentId,
        null
      );
    }

    const room = await runtime.databaseAdapter.getRoom(message.roomId);

    await runtime.getMemoryManager("messages").createMemory({
      entityId: message.entityId,
      agentId: message.agentId,
      roomId: message.roomId,
      content: {
        thought: `I unmuted the room ${room.name}`,
        actions: ["UNMUTE_ROOM_START"],
      },
    });
  },
  examples: [
    [
      {
        name: "{{name1}}",
        content: {
          text: "{{name3}}, you can unmute this channel now",
        },
      },
      {
        name: "{{name3}}",
        content: {
          text: "Done",
          actions: ["UNMUTE_ROOM"],
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "I could use some help troubleshooting this bug.",
        },
      },
      {
        name: "{{name3}}",
        content: {
          text: "Can you post the specific error message",
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "{{name2}}, please unmute this room. We could use your input again.",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "Sounds good",
          actions: ["UNMUTE_ROOM"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "{{name2}} wait you should come back and chat in here",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "im back",
          actions: ["UNMUTE_ROOM"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "unmute urself {{name2}}",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "unmuted",
          actions: ["UNMUTE_ROOM"],
        },
      },
    ],
    [
      {
        name: "{{name1}}",
        content: {
          text: "ay {{name2}} get back in here",
        },
      },
      {
        name: "{{name2}}",
        content: {
          text: "sup yall",
          actions: ["UNMUTE_ROOM"],
        },
      },
    ],
  ] as ActionExample[][],
} as Action;
