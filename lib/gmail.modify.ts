import { getGmailClient } from "./gmail";

export async function modifyMessageLabels(args: {
  messageId: string;
  addLabelIds?: string[];
  removeLabelIds?: string[];
}) {
  const gmail = await getGmailClient();
  await gmail.users.messages.modify({
    userId: "me",
    id: args.messageId,
    requestBody: {
      addLabelIds: args.addLabelIds || [],
      removeLabelIds: args.removeLabelIds || [],
    },
  });
}
