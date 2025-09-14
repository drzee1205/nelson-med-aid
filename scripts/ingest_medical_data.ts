import { supabaseService, MedicalChunk } from '../src/backend/supabase_service.js';
import { llmService } from '../src/backend/llm_service.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const textbookData = [
  {
    title: 'Nelson Textbook of Pediatrics',
    chapter: 'Chapter 1: The Field of Pediatrics',
    page: 1,
    url: 'https://example.com/nelson-pediatrics/chapter-1',
    text: `Pediatrics is the branch of medicine that involves the medical care of infants, children, and adolescents. The American Academy of Pediatrics recommends people be under pediatric care up to the age of 21. A medical doctor who specializes in this area is known as a pediatrician, or paediatrician. The word pediatrics and its cognates mean "healer of children"; they derive from two Greek words: παῖς (pais "child") and ἰατρός (iatros "doctor, healer"). Pediatricians work in hospitals, particularly those working in its subspecialties such as neonatology, and as outpatient primary care physicians.`
  },
  {
    title: 'Nelson Textbook of Pediatrics',
    chapter: 'Chapter 2: Growth and Development',
    page: 15,
    url: 'https://example.com/nelson-pediatrics/chapter-2',
    text: `Growth and development are key indicators of a child's health. Pediatricians monitor growth using standardized growth charts. Developmental milestones, such as smiling, crawling, and walking, are also closely tracked. Delays in either growth or development can be signs of underlying health issues. Nutrition plays a critical role in this stage, with breastfeeding being highly recommended for infants. Regular check-ups are essential to ensure that a child is on the right track.`
  },
  {
    title: 'Nelson Textbook of Pediatrics',
    chapter: 'Chapter 3: Common Infectious Diseases',
    page: 45,
    url: 'https://example.com/nelson-pediatrics/chapter-3',
    text: `Children are particularly susceptible to infectious diseases due to their developing immune systems. Common illnesses include the common cold, influenza, and ear infections. Vaccinations are a cornerstone of pediatric care, providing protection against serious diseases like measles, mumps, rubella, and polio. Hand hygiene is another effective way to prevent the spread of germs. Pediatricians are trained to diagnose and manage these conditions, providing guidance to parents on treatment and prevention.`
  }
];

function splitTextIntoChunks(text: string, chunkSize = 200): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

async function ingestMedicalData() {
  console.log('Starting medical data ingestion...');

  for (const section of textbookData) {
    const chunks = splitTextIntoChunks(section.text);
    for (const chunkText of chunks) {
      console.log(`Generating embedding for chunk: "${chunkText.substring(0, 30)}..."`);
      const embedding = await llmService.generateEmbedding(chunkText);

      if (embedding.length > 0) {
        const medicalChunk: MedicalChunk = {
          book_title: section.title,
          chapter_title: section.chapter,
          section_title: 'N/A', // Placeholder
          page_number: section.page,
          source_url: section.url,
          chunk_text: chunkText,
          embedding: embedding,
        };

        console.log('Storing medical chunk...');
        await supabaseService.storeMedicalChunks([medicalChunk]);
        console.log('Chunk stored successfully.');
      } else {
        console.error('Failed to generate embedding for chunk. Skipping.');
      }
    }
  }

  console.log('Medical data ingestion complete.');
}

ingestMedicalData().catch(console.error);
