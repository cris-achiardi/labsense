#!/usr/bin/env tsx
"use strict";
/**
 * Test script for PDF extraction functionality
 * Run with: npx tsx test-pdf-extraction.ts <path-to-pdf>
 */
Object.defineProperty(exports, "__esModule", { value: true });
const pdf_text_extractor_1 = require("./src/lib/pdf-parsing/pdf-text-extractor");
const fs_1 = require("fs");
async function testPDFExtraction() {
    const pdfPath = process.argv[2];
    if (!pdfPath) {
        console.log('Usage: npx tsx test-pdf-extraction.ts <path-to-pdf>');
        console.log('Example: npx tsx test-pdf-extraction.ts ./lab-sample.pdf');
        process.exit(1);
    }
    try {
        console.log('🔍 Testing PDF extraction...');
        console.log(`📄 File: ${pdfPath}`);
        // Read PDF file
        const pdfBuffer = (0, fs_1.readFileSync)(pdfPath);
        console.log(`📊 File size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        // Extract text
        const startTime = Date.now();
        const result = await (0, pdf_text_extractor_1.extractTextFromPDF)(pdfBuffer);
        const duration = Date.now() - startTime;
        console.log(`⏱️  Extraction time: ${duration}ms`);
        if (result.success) {
            console.log('✅ Extraction successful!');
            console.log(`📑 Pages: ${result.metadata?.pageCount || 0}`);
            console.log(`📝 Total text length: ${result.fullText.length} characters`);
            console.log(`📄 First page length: ${result.firstPageText.length} characters`);
            // Show first 500 characters of extracted text
            console.log('\n📋 First 500 characters:');
            console.log('─'.repeat(50));
            console.log(result.firstPageText.substring(0, 500));
            console.log('─'.repeat(50));
            // Look for Chilean patterns
            console.log('\n🇨🇱 Chilean patterns detected:');
            const rutPattern = /\d{1,2}\.\d{3}\.\d{3}-[\dkK]/g;
            const ruts = result.firstPageText.match(rutPattern);
            if (ruts) {
                console.log(`📋 RUTs found: ${ruts.join(', ')}`);
            }
            else {
                console.log('❌ No RUTs detected');
            }
            // Look for medical terms
            const medicalTerms = ['GLUCOSA', 'COLESTEROL', 'TRIGLICÉRIDOS', 'HEMOGLOBINA', 'GLICEMIA'];
            const foundTerms = medicalTerms.filter(term => result.fullText.toUpperCase().includes(term));
            if (foundTerms.length > 0) {
                console.log(`🏥 Medical terms found: ${foundTerms.join(', ')}`);
            }
            else {
                console.log('❌ No medical terms detected');
            }
        }
        else {
            console.error('❌ Extraction failed:', result.error);
        }
    }
    catch (error) {
        console.error('💥 Test error:', error);
    }
}
testPDFExtraction();
