import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChatClientWrapper } from "@/components/chat/chat-client-wrapper";
import { getUserTokenBalance } from "@/lib/tokens";

export const dynamic = "force-dynamic";

interface ChatsPageProps {
  searchParams: Promise<{
    chat?: string;
    character?: string;
  }>;
}

export default async function ChatsPage({ searchParams }: ChatsPageProps) {
  // 1. Authenticate user session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/auth/login");
  }

  const userId = session.user.id;
  const resolvedParams = await searchParams;
  const characterSlug = resolvedParams.character || "";
  let activeChatId = resolvedParams.chat || "";

  // 2. Redirect/Initialize chat if characterSlug is specified
  if (characterSlug) {
    const character = await db.character.findUnique({
      where: { slug: characterSlug }
    });

    if (character) {
      // Look for an existing chat session with this character
      const existingChat = await db.chat.findFirst({
        where: { userId, characterId: character.id },
        orderBy: { updatedAt: "desc" }
      });

      if (existingChat) {
        redirect(`/chats?chat=${existingChat.id}`);
      } else {
        // Initialize a new chat session copying the system prompt snapshot
        const newChat = await db.chat.create({
          data: {
            userId,
            characterId: character.id,
            title: character.name,
            systemPromptSnapshot: character.systemPrompt
          }
        });

        // Increment usageCount transactionally
        await db.character.update({
          where: { id: character.id },
          data: {
            usageCount: {
              increment: 1
            }
          }
        });

        redirect(`/chats?chat=${newChat.id}`);
      }
    }
  }

  // 3. Fetch all active chats for this user to render in sidebar
  const chats = await db.chat.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      character: {
        select: {
          id: true,
          slug: true,
          name: true,
          avatarType: true,
          avatarValue: true,
          avatarColor: true,
          category: true,
          tone: true,
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1 // Only retrieve the latest message for the sidebar preview
      }
    }
  });

  // If there are chats but no activeChatId selected, default to the most recent one
  if (!activeChatId && chats.length > 0) {
    redirect(`/chats?chat=${chats[0].id}`);
  }

  // 4. Retrieve token balance for user
  const tokenBalance = await getUserTokenBalance(userId);

  return (
    <ChatClientWrapper
      user={session.user}
      chats={chats as any[]}
      activeChatId={activeChatId}
      initialTokenBalance={tokenBalance}
    />
  );
}
