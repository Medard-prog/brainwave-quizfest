
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Groq from "npm:groq-sdk";

const groqApiKey = Deno.env.get('GROQ_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, instructions } = await req.json();
    
    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Topic is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });

    const prompt = `Create a quiz with 4 multiple choice questions about ${topic}. ${instructions ? `Additional instructions: ${instructions}` : ''}
    
    Important: Return ONLY a valid JSON array with the following structure for each question (no additional text):
    
    [
      {
        "question_text": "Question text here?",
        "question_type": "multiple_choice",
        "options": [
          {"text": "Option 1"},
          {"text": "Option 2"},
          {"text": "Option 3"},
          {"text": "Option 4"}
        ],
        "correct_answer": "Exact text of the correct option",
        "points": 10,
        "time_limit": 30
      },
      ... more questions
    ]
    
    Make sure to return ONLY the JSON array with no explanations before or after it.`;

    console.log("Sending prompt to Groq:", topic);
    
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    const responseContent = completion.choices[0]?.message?.content || "";
    console.log("Received response from Groq");
    
    // Extract the JSON from the response
    let jsonMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
    let jsonString = jsonMatch ? jsonMatch[0] : responseContent;
    
    try {
      // Parse the JSON to verify it's valid
      const questions = JSON.parse(jsonString);
      
      // Add unique IDs to questions and options
      const processedQuestions = questions.map(q => ({
        ...q,
        id: crypto.randomUUID(),
        options: q.options.map(opt => ({
          ...opt,
          id: crypto.randomUUID()
        }))
      }));
      
      return new Response(
        JSON.stringify({ questions: processedQuestions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (jsonError) {
      console.error("Failed to parse JSON from Groq response:", jsonError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse generated quiz", 
          rawResponse: responseContent 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error("Error in generate-quiz function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
