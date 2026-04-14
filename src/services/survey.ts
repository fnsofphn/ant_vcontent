import { supabase } from '@/lib/supabaseClient';
import { DEFAULT_SURVEY_CONFIG } from '@/data/surveyDefaults';

export async function getSurveyConfig(surveyCode: string) {
  if (!supabase) return DEFAULT_SURVEY_CONFIG;

  const { data, error } = await supabase
    .from('survey_configs')
    .select('config_data')
    .eq('survey_code', surveyCode)
    .maybeSingle();

  if (error) {
    console.error('getSurveyConfig error', error);
    return DEFAULT_SURVEY_CONFIG; // Fallback
  }

  if (!data) {
    return DEFAULT_SURVEY_CONFIG;
  }

  return data.config_data || DEFAULT_SURVEY_CONFIG;
}

export async function submitSurveyResponse(surveyCode: string, payload: any, submitterInfo: any) {
  if (!supabase) {
    console.warn('Supabase not connected. Survey response not saved to DB.');
    return; // allow UI to fall back to backup JSON download
  }

  const { error } = await supabase.from('survey_responses').insert([
    {
      survey_code: surveyCode,
      submitter_info: submitterInfo,
      payload: payload,
    },
  ]);

  if (error) {
    console.error('submitSurveyResponse error', error);
    throw error;
  }
}

export async function listSurveyResponses(surveyCode: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .eq('survey_code', surveyCode)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('listSurveyResponses error', error);
    throw error;
  }

  return data;
}

export async function saveSurveyConfig(surveyCode: string, configData: any) {
  if (!supabase) return;

  // upsert configuration
  const { error } = await supabase
    .from('survey_configs')
    .upsert(
      { survey_code: surveyCode, config_data: configData },
      { onConflict: 'survey_code' }
    );

  if (error) {
    console.error('saveSurveyConfig error', error);
    throw error;
  }
}
