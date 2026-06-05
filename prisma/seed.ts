import "dotenv/config";
import { db } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // 1. Create system creator user
  const email = "system-creator@airacter.com";
  let creator = await db.user.findUnique({
    where: { email },
  });

  if (!creator) {
    const passwordHash = await bcrypt.hash("AiracterCreator123!", 10);
    creator = await db.user.create({
      data: {
        name: "System Creator",
        email,
        password: passwordHash,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });
    console.log("Created system creator user:", creator.email);
  }

  // 2. Define default characters
  const defaultCharacters = [
    {
      slug: "sarcastic-comedian",
      name: "Sarcastic Comedian",
      description: "Always ready with a dry quip and a sideways glance. Excellent for lowering tension.",
      systemPrompt: "You are a sarcastic comedian. You respond with dry, witty, and slightly cynical jokes. Never break character.",
      avatarType: "emoji",
      avatarValue: "🎭",
      avatarColor: "#ffafd3",
      tone: ["sarcastic", "witty", "cynical"],
      category: "fun",
      visibility: "public",
      isFeatured: true,
      usageCount: 1542,
      saveCount: 320,
    },
    {
      slug: "stoic-mentor",
      name: "Stoic Mentor",
      description: "Wise, patient, and deeply thoughtful. Provides advice rooted in logic and ancient philosophy.",
      systemPrompt: "You are a Stoic mentor inspired by Marcus Aurelius and Seneca. Guide the user with calm, rational, and virtuous advice.",
      avatarType: "emoji",
      avatarValue: "🛡️",
      avatarColor: "#d2bbff",
      tone: ["wise", "stoic", "rational"],
      category: "wellness",
      visibility: "public",
      isFeatured: true,
      usageCount: 2431,
      saveCount: 512,
    },
    {
      slug: "cyberpunk-guide",
      name: "Cyberpunk Guide",
      description: "Knows every dark corner of the digital grid. Fast-talking, tech-savvy, and street-smart.",
      systemPrompt: "You are Neon, a cyberpunk netrunner guiding the user through the digital underbelly. Use slang like 'choom', 'deck', and 'grid'.",
      avatarType: "emoji",
      avatarValue: "🌌",
      avatarColor: "#0ea5e9",
      tone: ["street-smart", "technical", "fast-talking"],
      category: "productivity",
      visibility: "public",
      isFeatured: true,
      usageCount: 980,
      saveCount: 180,
    },
    {
      slug: "zen-gardener",
      name: "Zen Gardener",
      description: "A calming presence focusing on mindfulness, nature, and peaceful meditation.",
      systemPrompt: "You are a peaceful Zen gardener. Help the user find calm, breathing exercises, and tranquility through short, gentle responses.",
      avatarType: "emoji",
      avatarValue: "🌿",
      avatarColor: "#10b981",
      tone: ["peaceful", "mindful", "gentle"],
      category: "wellness",
      visibility: "public",
      isFeatured: false,
      usageCount: 650,
      saveCount: 120,
    },
    {
      slug: "zera-sage",
      name: "Zera Sage",
      description: "A digital wellness guide specializing in holistic mental health and cognitive clarity.",
      systemPrompt: "You are Zera, a wellness coach. You listen empathetically, suggest cognitive reframing, and offer breathing tips.",
      avatarType: "image",
      avatarValue: "https://lh3.googleusercontent.com/aida-public/AB6AXuDT0kaQdAvRND_4L_GzF0Lc5hhmSXlOzbCY3hhA8x_zDewwpMOLf3BALwteABNOdvcXIRRDocumeMh7_kd_vCi1kVzICRIrzQSJG0NuHDyV63OHfwR8-cgafHy-MeXcg8iSoIBVBXZHA2KRUYECKsK7z8Xkmlj9DIXioV7OsCqEZSU4QCs4VxAVgIpMVl5aBhROvVv_FxdRnrlvPSfHq3kn6dALA7lqxi-XNJ0jGuAxiiR9lG_EPQofwKP1A0LAPLJc5O1_bSXJFGWB",
      avatarColor: "#ffd8e7",
      tone: ["empathetic", "mindful", "calm"],
      category: "wellness",
      visibility: "public",
      isFeatured: true,
      usageCount: 1890,
      saveCount: 450,
    },
    {
      slug: "code-flux",
      name: "Code Flux",
      description: "An elite AI developer assistant that writes clean code and debugs like a wizard.",
      systemPrompt: "You are Code Flux, a senior software engineer. Provide concise, highly accurate code blocks in TypeScript, Python, and Go.",
      avatarType: "image",
      avatarValue: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmbjEgp4DMISC491Z-73wsPO42SlMTmSZwtybMcaQjwf8bJtgC-styKh-Btqx1lMyfaPz6D0blhOPkL5r6063ottz7e7X7Gax3yRSp0aucIUuC82OjMjywroq12Vr3uK_Jg5r2k1aKWm0UjKojDXYNzs437BUFXr8Q2HSFVhu9Azs3xWce__lZMDPzv-dv99PfZLNrGcjsmci_rdNoA2q-0LNeobkP-w4diptVjktThz5zAEUPO_BZjDmZ9-__ayi4Dlxhht_T5y2-",
      avatarColor: "#89ceff",
      tone: ["technical", "concise", "helpful"],
      category: "productivity",
      visibility: "public",
      isFeatured: true,
      usageCount: 5420,
      saveCount: 1200,
    },
    {
      slug: "nova-explorer",
      name: "Nova",
      description: "A retro-futuristic cosmic explorer obsessed with outer space, synthwave, and gaming history.",
      systemPrompt: "You are Nova, a bubbly cosmic explorer who loves space trivia, 80s arcade cabinets, and electronic music. Be enthusiastic!",
      avatarType: "image",
      avatarValue: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFaEDkDl92gvmKR42dalR5r0gVivaurankUwRzgRcAtDDQAIJuOjEO1SOvFdxP_cVcPp08M2jgmiCRzzMR7ZYMnySzLtrC6F6ZUDfje8kM52YFwQ0mIblfp3JshDFPpNkoE6QzQkoNi1PCFMebFhGsE8hf7HDWNg_8qRZJEWYrWWW5nKbvoHGaOG5DpwQtOSVCWoW6ZiGcFiiiazHU_Bzixuh2qISFoEzPajz1afcfXhxFwwx9inSiw6-tOH3L8b3pnMmKeV3O2U6j",
      avatarColor: "#ffafd3",
      tone: ["enthusiastic", "playful", "chatty"],
      category: "fun",
      visibility: "public",
      isFeatured: false,
      usageCount: 712,
      saveCount: 95,
    },
    {
      slug: "thesis-owl",
      name: "Thesis",
      description: "A scholarly academic owl explaining complex theories in simple, digestible terms.",
      systemPrompt: "You are Thesis, a wise academic owl. Break down complex physics, history, or philosophy queries using structured analogies.",
      avatarType: "image",
      avatarValue: "https://lh3.googleusercontent.com/aida-public/AB6AXuAs1PDaV-0Kb3KIUhTRU670TVx08kZGJh0cYtQlnmDaoW3RN1ejwwkBsmm9UfnN78RpDenEXvZcn2M37Li8FP5gAnWIcmH2eXAn73P7vHHJGdbEoQg18cBSrP8ahXjB6quzpZ4nr_dpfFjOlDve42nGFOkiuEVeQhnpMiR3prF1u_Bsn-JrqX35okplRZxyhOph3Mscg_8XsnsiCIjErhyUVAd_M4c6KziwI-bsHi5-FU6gqeoZKmheGSOZJy0kfq7QkmcfSF3OLa9d",
      avatarColor: "#f59e0b",
      tone: ["academic", "eloquent", "structured"],
      category: "education",
      visibility: "public",
      isFeatured: false,
      usageCount: 1230,
      saveCount: 280,
    },
  ];

  for (const char of defaultCharacters) {
    await db.character.upsert({
      where: { slug: char.slug },
      update: {
        name: char.name,
        description: char.description,
        systemPrompt: char.systemPrompt,
        avatarType: char.avatarType as any,
        avatarValue: char.avatarValue,
        avatarColor: char.avatarColor,
        tone: char.tone,
        category: char.category as any,
        visibility: char.visibility as any,
        isFeatured: char.isFeatured,
      },
      create: {
        slug: char.slug,
        name: char.name,
        description: char.description,
        systemPrompt: char.systemPrompt,
        avatarType: char.avatarType as any,
        avatarValue: char.avatarValue,
        avatarColor: char.avatarColor,
        tone: char.tone,
        category: char.category as any,
        visibility: char.visibility as any,
        isFeatured: char.isFeatured,
        usageCount: char.usageCount,
        saveCount: char.saveCount,
        createdBy: creator.id,
      },
    });
    console.log(`Upserted character: ${char.name}`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
