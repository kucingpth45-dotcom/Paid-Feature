import { GoogleGenAI, Modality, Part } from "@google/genai";
import { ArtStyle, RegenerationModel } from "../types";

/**
 * Creates and returns a new GoogleGenAI instance with the current API key.
 * @throws An error if the API key is not set.
 */
const getAiClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not set. Please configure the API_KEY environment variable.');
    }
    return new GoogleGenAI({ apiKey });
}

/**
 * Translates a given text to a specified target language using Gemini.
 * @param textToTranslate The text to be translated.
 * @param targetLanguage The target language (e.g., 'Indonesian').
 * @returns A promise that resolves to the translated text.
 */
export async function translateText(textToTranslate: string, targetLanguage: string): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [{
                text: `Translate the following text to ${targetLanguage}. Only return the translated text, without any additional explanations, labels, or context.
Text: "${textToTranslate}"`
            }]
        },
        config: {
            // Lower temperature for more direct, less creative translation
            temperature: 0.1,
        }
    });
    return response.text.trim();
}

/**
 * Uses Gemini to generate a textual description of a given image.
 * @param base64Data The base64 encoded string of the source image.
 * @returns A promise that resolves to a detailed description of the image.
 */
export async function describeImage(base64Data: string): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: 'image/jpeg',
                    }
                },
                {
                    text: 'Generate a highly detailed, objective description of this image, suitable for a text-to-image AI. Describe the scene, subjects, colors, lighting, and composition as if you were explaining it to someone who cannot see it. Avoid subjective interpretations or artistic styles. The description should be a single, dense paragraph.'
                }
            ]
        }
    });
    return response.text;
}

/**
 * Returns an instructional prompt for Gemini's image-to-image model.
 * @param style The selected ArtStyle.
 * @returns A string prompt for image-to-image regeneration.
 */
const getGeminiInstructionalPrompt = (style: ArtStyle): string => {
    switch (style) {
        case ArtStyle.REALISTIC:
            return "Recreate this image as an ultra-realistic, photorealistic, high-detail photograph. It should look like it was shot with a professional DSLR camera, with sharp focus and intricate details.";
        case ArtStyle.CARTOON:
            return "Recreate this image as a vibrant, colorful, bold-lined cartoon illustration in a playful style. Use cel-shading, expressive characters, and clean lines.";
        case ArtStyle.THREE_D_PIXAR:
            return "Recreate this image in the style of a modern 3D animated film, like those from Pixar. It should have soft lighting, detailed textures, and expressive, rounded characters with a friendly and appealing look.";
        case ArtStyle.ANIME:
            return "Recreate this image as a beautiful Japanese anime scene, in the style of a critically acclaimed animation studio. It should have detailed background art, cel-shaded characters, and cinematic anime lighting.";
        case ArtStyle.VINTAGE_PHOTO:
            return "Recreate this image as an authentic-looking vintage sepia photograph from the early 20th century. It should have a grainy texture, faded tones, and soft focus to capture a timeless moment.";
        case ArtStyle.CLAYMATION:
            return "Recreate this image as a charming claymation stop-motion scene with a handcrafted look. The models should be textured with visible fingerprints in the clay, and have whimsical lighting.";
        case ArtStyle.FANTASY_ART:
            return "Recreate this image as an epic digital fantasy art painting. It needs ethereal lighting, intricate details, and a mythical atmosphere, in the style of a high-fantasy book cover.";
        case ArtStyle.NEON_PUNK:
            return "Recreate this image as a neon-drenched, cyberpunk cityscape scene. It should have glowing neon lights, rainy streets with reflections, high-tech gadgets, and a dystopian 'neon punk' aesthetic.";
        default:
            return `Recreate this image in the style of a high-detail, cinematic image with the theme of '${style}'.`;
    }
};

/**
 * Returns a stylistic suffix for Imagen's text-to-image model.
 * @param style The selected ArtStyle.
 * @returns A string suffix to append to the main prompt.
 */
const getImagenStyleSuffix = (style: ArtStyle): string => {
    switch (style) {
        case ArtStyle.REALISTIC: return ', ultra-realistic, photorealistic, 8k, sharp focus, professional DSLR photo.';
        case ArtStyle.CARTOON: return ', vibrant cartoon illustration, bold lines, cel-shaded, playful style.';
        case ArtStyle.THREE_D_PIXAR: return ', in the style of a 3D Pixar animated film, soft lighting, detailed textures, expressive characters.';
        case ArtStyle.ANIME: return ', beautiful Japanese anime scene, style of a top animation studio, cinematic anime lighting.';
        case ArtStyle.VINTAGE_PHOTO: return ', authentic vintage sepia photograph, grainy texture, faded tones, early 20th century.';
        case ArtStyle.CLAYMATION: return ', charming claymation stop-motion scene, handcrafted look, visible fingerprints in the clay.';
        case ArtStyle.FANTASY_ART: return ', epic digital fantasy art painting, ethereal lighting, intricate details, mythical atmosphere.';
        case ArtStyle.NEON_PUNK: return ', neon-drenched cyberpunk cityscape, glowing neon lights, rainy streets, dystopian aesthetic.';
        default: return `, in the style of ${style}.`;
    }
}

/**
 * Maps a float aspect ratio to the closest supported string value for Imagen.
 * @param ratio The numeric aspect ratio.
 * @returns A supported aspect ratio string ('1:1', '3:4', '4:3', '9:16', '16:9').
 */
const mapAspectRatioToImagen = (ratio: number): '1:1' | '3:4' | '4:3' | '9:16' | '16:9' => {
  const supportedRatios = {
    '1:1': 1,
    '4:3': 4 / 3,
    '3:4': 3 / 4,
    '16:9': 16 / 9,
    '9:16': 9 / 16,
  };

  let closest = '1:1' as keyof typeof supportedRatios;
  let minDiff = Math.abs(ratio - supportedRatios[closest]);

  for (const key in supportedRatios) {
    const typedKey = key as keyof typeof supportedRatios;
    const diff = Math.abs(ratio - supportedRatios[typedKey]);
    if (diff < minDiff) {
      minDiff = diff;
      closest = typedKey;
    }
  }
  return closest;
};


/**
 * Regenerates an image using Gemini's image-to-image capabilities.
 * @param base64Data The base64 encoded string of the source image.
 * @param style The artistic style to apply.
 * @returns A promise resolving to the new image data and prompt.
 */
async function regenerateImageWithGemini(
  base64Data: string, 
  style: ArtStyle, 
): Promise<{ image: string; prompt: string; }> {
    const ai = getAiClient();
    const finalPrompt = getGeminiInstructionalPrompt(style);
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: finalPrompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return { image: part.inlineData.data, prompt: finalPrompt };
        }
      }
    }
    
    if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION' || response.promptFeedback?.blockReason) {
        throw new Error(`Image regeneration was blocked. Reason: ${candidate?.finishReason || response.promptFeedback?.blockReason}. Please try a different style or frame.`);
    }

    throw new Error('No image was generated by Gemini.');
}

/**
 * Generates an image using Imagen's text-to-image capabilities.
 * @param basePrompt The detailed description of the image.
 * @param style The artistic style to apply.
 * @param aspectRatio The target aspect ratio.
 * @returns A promise resolving to the new image data and prompt.
 */
async function generateImageWithImagen(
    basePrompt: string,
    style: ArtStyle,
    aspectRatio: number
): Promise<{ image: string; prompt: string }> {
    const ai = getAiClient();
    const finalPrompt = `${basePrompt}${getImagenStyleSuffix(style)}`;

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: finalPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: mapAspectRatioToImagen(aspectRatio),
        },
    });

    const generatedImage = response.generatedImages?.[0];
    if (generatedImage?.image?.imageBytes) {
        return { image: generatedImage.image.imageBytes, prompt: finalPrompt };
    }
    
    // Fix: Correctly access promptFeedback from the top-level response for generateImages.
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Image generation was blocked. Reason: ${response.promptFeedback.blockReason}. Please try a different frame.`);
    }
    
    throw new Error('No image was generated by Imagen.');
}


interface RegenerateOptions {
  model: RegenerationModel;
  style: ArtStyle;
  aspectRatio: number;
  base64Data?: string;
  prompt?: string;
}

/**
 * Regenerates an image using the selected AI model (Gemini or Imagen).
 * This function acts as a dispatcher to the appropriate model-specific function.
 * @param options The regeneration options, including model, style, and source data.
 * @returns A promise that resolves to an object containing the new image and the prompt used.
 */
export const regenerateImage = async (
  options: RegenerateOptions
): Promise<{ image: string; prompt: string; }> => {
  const { model, style, aspectRatio, base64Data, prompt } = options;

  try {
    if (model === 'imagen') {
        if (!prompt) {
            throw new Error('A text prompt is required for the Imagen model.');
        }
        return await generateImageWithImagen(prompt, style, aspectRatio);
    } else { // 'gemini'
        if (!base64Data) {
            throw new Error('Base64 image data is required for the Gemini model.');
        }
        return await regenerateImageWithGemini(base64Data, style);
    }
  } catch (error) {
    console.error(`Error calling ${model} API for regeneration:`, error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('Your Gemini API key is not valid. Please check your configuration.');
        }
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('API rate limit or quota exceeded. Please try again later.');
        }
         // Rethrow specific "blocked" error messages from underlying functions
        if (error.message.includes('blocked')) {
            throw error;
        }
    }
    throw new Error(`Failed to regenerate image with ${model}. Check the console for details.`);
  }
};


/**
 * Edits an image based on a textual prompt using Gemini.
 * @param base64Data The base64 encoded string of the source image.
 * @param prompt The text prompt describing the desired changes.
 * @returns A promise that resolves to an object containing the edited image and the prompt used.
 */
export const editImage = async (
  base64Data: string,
  prompt: string,
): Promise<{ image: string; prompt: string; }> => {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const candidate = response.candidates?.[0];

    if (candidate && candidate.content && candidate.content.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData) {
          return {
              image: part.inlineData.data,
              prompt: `Edited with user prompt: "${prompt}"`
          };
        }
      }
    }
    
    if (candidate?.finishReason === 'SAFETY' || candidate?.finishReason === 'RECITATION' || response.promptFeedback?.blockReason) {
        throw new Error(`Image editing was blocked. Reason: ${candidate?.finishReason || response.promptFeedback?.blockReason}. Please modify your prompt and try again.`);
    }

    throw new Error('No image was generated in the API response for editing.');
  } catch (error) {
    console.error("Error calling Gemini API for editing:", error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            throw new Error('Your Gemini API key is not valid. Please check your configuration.');
        }
        if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('API rate limit or quota exceeded. Please try again later.');
        }
        if (error.message.includes('blocked')) {
            throw error;
        }
    }
    throw new Error('Failed to edit image with Gemini. Check the console for details.');
  }
};