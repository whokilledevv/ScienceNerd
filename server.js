
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-extraction');
const fetch = require('node-fetch');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());
app.use(express.static('public'));

const apiKey = process.env.GROQ_API_KEY;

// 1. تحليل الـ PDF
app.post('/upload-pdf', upload.single('pdf'), async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: "No file" });
    try {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdf(dataBuffer);
        const text = data.text.substring(0, 3000);

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: "You are a professional science teacher. Return ONLY JSON with {title, summary, laws, concepts} in  ENGLICH" },
                    { role: "user", content: `Analyze: ${text}` }
                ],
                response_format: { type: "json_object" }
            })
        });
        const result = await response.json();
        if (result.error) return res.status(500).json({ success: false, error: result.error.message });
        
        fs.unlinkSync(req.file.path);
        res.json({ success: true, analysis: result.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 2. تعديل الشات عشان يشتغل بـ Groq (ده اللي كان ناقصك)
// 1. General Chat (Talk about anything!)
app.post('/chat', async (req, res) => {
    const { message, history } = req.body;
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "You are ScienceNerd AI, a versatile and friendly global assistant. You can discuss ANY topic (science, life, technology, philosophy, etc.). ALWAYS respond in English unless the user explicitly speaks to you in Arabic. If they speak Arabic, you can reply in Arabic, but default to English. Be concise and engaging." 
                    },
                    ...history,
                    { role: "user", content: message }
                ]
            })
        });
        const result = await response.json();
        res.json({ success: true, reply: result.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// 2. Tinkercad-Style Lab Prompt
app.post('/generate-sim', async (req, res) => {
    const { analysis } = req.body;
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `Create a professional 'Workbench' style simulation like Tinkercad.
                        - UI: Dark Mode, Professional Engineering Aesthetics.
                        - Tools: A sidebar with draggable components or a 'Component Library'.
                        - Visuals: Use HTML5 Canvas to draw high-quality schematic symbols or 3D-like objects.
                        - Interaction: Real-time calculation and visual feedback (e.g., wires glowing, meters moving).
                        - Language: 100% English.
                        - Return ONLY the single HTML file code.`
                    },
                    { role: "user", content: `Build a Tinkercad-inspired visual lab for: ${analysis}` }
                ]
            })
        });
        const result = await response.json();
        let htmlCode = result.choices[0].message.content.replace(/```html|```/g, "").trim();
        res.json({ success: true, html: htmlCode });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});
app.post('/generate-sim', async (req, res) => {
    const { analysis } = req.body;
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: `Create a 'Water Sort Puzzle' style visual lab in a single HTML file.
                        - UI: Dark, glass-morphism dashboard with 4-5 test tubes.
                        - GAMEPLAY: Test tubes have randomized color layers. Users can select a tube and pour its top color layer into another tube (if empty or same top color).
                        - VISUALS: Use Canvas or JS to animate the liquid flowing smoothly between tubes. Liquid levels must change dynamically.
                        - INTERACTION: Drag or Click to Select/Pour. Show a 'Level Complete!' message when colors are sorted.
                        - CHEMISTRY CONNECTION: Each color represents a different chemical solution from the lesson.
                        - TOOLBAR: Include a 'Restart Level' button.
                        - RETURN ONLY THE HTML CODE.`
                    },
                    { role: "user", content: `Build a 'Water Sort Puzzle' style game for: ${analysis}` }
                ]
            })
        });
        const result = await response.json();
        let htmlCode = result.choices[0].message.content.replace(/```html|```/g, "").trim();
        res.json({ success: true, html: htmlCode });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 ScienceNerd Running: http://localhost:${PORT}`);
});
app.post('/generate-quiz', async (req, res) => {
    const { analysis } = req.body;
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { 
                        role: "system", 
                        content: "Generate 5 unique MCQ questions. IMPORTANT: Pick RANDOM parts of the lesson each time. Use ONLY English for questions and options. Return ONLY a JSON object: { \"quiz\": [{ \"question\": \"...\", \"options\": [\"...\"], \"answer\": \"...\" }] }." 
                    },
                    { role: "user", content: `Generate a fresh set of questions for: ${analysis}. Make sure they are different from previous sets.` }
                ],
                // إضافة temperature عالية بتخلي الـ AI "مبدع" ويغير الإجابات والأسئلة كل مرة
                temperature: 0.9, 
                response_format: { type: "json_object" }
            })
        });
        const result = await response.json();
        const quizData = JSON.parse(result.choices[0].message.content);
        res.json({ success: true, quiz: JSON.stringify(quizData.quiz) });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});