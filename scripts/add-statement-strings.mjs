#!/usr/bin/env node
/**
 * One-shot: add the short hero line (heroTag2) and the statement-section
 * strings to every locale. Safe to re-run.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "messages");

const STRINGS = {
  en: {
    landing: { heroTag2: "Make your company AI-native." },
    statement: {
      title: "Your company already knows how to run itself.",
      lead: "The knowledge is all there — in files, tools, and heads. Toone gives it structure: a living graph of what your company knows, and an organization of AI agents that puts it to work on schedule.",
      cta: "See how it works",
    },
  },
  de: {
    landing: { heroTag2: "Mach dein Unternehmen AI-native." },
    statement: {
      title: "Dein Unternehmen weiß längst, wie es läuft.",
      lead: "Das Wissen ist schon da — in Dateien, Tools und Köpfen. Toone gibt ihm Struktur: ein lebendiger Graph dessen, was dein Unternehmen weiß, und eine Organisation aus KI-Agenten, die es nach Zeitplan einsetzt.",
      cta: "So funktioniert es",
    },
  },
  es: {
    landing: { heroTag2: "Haz que tu empresa sea AI-native." },
    statement: {
      title: "Tu empresa ya sabe cómo funcionar sola.",
      lead: "El conocimiento ya está ahí — en archivos, herramientas y cabezas. Toone le da estructura: un grafo vivo de lo que sabe tu empresa y una organización de agentes de IA que lo pone a trabajar según calendario.",
      cta: "Mira cómo funciona",
    },
  },
  fr: {
    landing: { heroTag2: "Rendez votre entreprise AI-native." },
    statement: {
      title: "Votre entreprise sait déjà comment tourner.",
      lead: "Le savoir est déjà là — dans les fichiers, les outils et les têtes. Toone lui donne une structure : un graphe vivant de ce que sait votre entreprise, et une organisation d'agents IA qui le met au travail selon un calendrier.",
      cta: "Voir comment ça marche",
    },
  },
  it: {
    landing: { heroTag2: "Rendi la tua azienda AI-native." },
    statement: {
      title: "La tua azienda sa già come funzionare.",
      lead: "La conoscenza c'è già — in file, strumenti e teste. Toone le dà struttura: un grafo vivo di ciò che la tua azienda sa e un'organizzazione di agenti IA che lo mette al lavoro secondo programma.",
      cta: "Scopri come funziona",
    },
  },
  nl: {
    landing: { heroTag2: "Maak je bedrijf AI-native." },
    statement: {
      title: "Je bedrijf weet allang hoe het moet draaien.",
      lead: "De kennis is er al — in bestanden, tools en hoofden. Toone geeft er structuur aan: een levende graaf van wat je bedrijf weet, en een organisatie van AI-agents die het volgens schema aan het werk zet.",
      cta: "Zo werkt het",
    },
  },
  pt: {
    landing: { heroTag2: "Torne sua empresa AI-native." },
    statement: {
      title: "Sua empresa já sabe como funcionar.",
      lead: "O conhecimento já está lá — em arquivos, ferramentas e cabeças. O Toone dá estrutura a ele: um grafo vivo do que sua empresa sabe e uma organização de agentes de IA que o coloca para trabalhar no cronograma.",
      cta: "Veja como funciona",
    },
  },
  ru: {
    landing: { heroTag2: "Сделайте вашу компанию AI-native." },
    statement: {
      title: "Ваша компания уже знает, как ей работать.",
      lead: "Знания уже есть — в файлах, инструментах и головах. Toone даёт им структуру: живой граф знаний компании и организацию ИИ-агентов, которая запускает их в работу по расписанию.",
      cta: "Посмотрите, как это работает",
    },
  },
};

for (const [locale, additions] of Object.entries(STRINGS)) {
  const file = path.join(DIR, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  for (const [ns, entries] of Object.entries(additions)) {
    data[ns] = { ...(data[ns] ?? {}), ...entries };
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`updated ${locale}.json`);
}
