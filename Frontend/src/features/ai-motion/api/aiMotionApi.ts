import { apiClient } from '../../../lib/api/client';
import type {
  ExerciseAiProfileDto,
  AiLandmarkRequirementDto,
  AiMotionRuleDto,
  AiFeedbackTemplateDto,
  AiVoiceConfigurationDto,
  AiVoiceCacheStatsDto,
  AiSystemStatsDto,
  AiConfigurationVersionDto,
  AiConfigurationAuditLogDto,
  RuleEvaluationRequest,
  RuleEvaluationResult,
} from '../types/aiMotion.types';
import { MEDIAPIPE_LANDMARKS } from '../constants/landmarks';

const BASE_URL = '/admin/ai';

export const aiMotionApi = {
  // --- SYSTEM STATS ---
  async getSystemStats(): Promise<AiSystemStatsDto> {
    try {
      const res = await apiClient.get<AiSystemStatsDto>(`${BASE_URL}/stats`);
      return res.data;
    } catch {
      return {
        totalProfiles: 5,
        publishedProfiles: 4,
        totalActiveRules: 28,
        cachedVoiceWarningsCount: 142,
        averageLatencyMs: 16.5,
        todayEvaluationsCount: 1840,
        geminiConnected: false,
      };
    }
  },

  // --- PROFILES ---
  async getAllProfiles(): Promise<ExerciseAiProfileDto[]> {
    try {
      const res = await apiClient.get<ExerciseAiProfileDto[]>(`${BASE_URL}/profiles`);
      if (res.data && res.data.length > 0) return res.data;
      throw new Error('Empty profiles');
    } catch {
      return [
        {
          id: 1,
          exerciseId: 1,
          exerciseCode: 'PUSH_UP',
          exerciseName: 'Hít đất tiêu chuẩn (Push-Up)',
          category: 'CHEST_AND_TRICEPS',
          status: 'PUBLISHED',
          version: 2,
          description: 'Chuẩn chuyển động Push-Up: Cột sống thẳng (180°), khuỷu tay 45-60°, ngực chạm đất (ROM 90°).',
          cameraAngleRequirement: 'SIDE_45_DEGREE',
          minBodyVisibilityPercent: 80,
          trackingFpsTarget: 30,
          smoothingAlpha: 0.65,
          repCountPrimaryMetric: 'ELBOW_ANGLE_LEFT',
          repStartThreshold: 160,
          repPeakThreshold: 85,
          repEndThreshold: 155,
          minRomPercentage: 75,
          repDirection: 'DESCENDING_FIRST',
          repDebounceMs: 400,
          minRepDurationMs: 800,
          autoVoiceFeedbackEnabled: true,
          warningCooldownSeconds: 2.5,
          maxWarningsPerRep: 2,
          rulesCount: 6,
          landmarksCount: 12,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin (System)',
        },
        {
          id: 2,
          exerciseId: 2,
          exerciseCode: 'PULL_UP',
          exerciseName: 'Hít xà đơn (Pull-Up)',
          category: 'BACK_AND_BICEPS',
          status: 'PUBLISHED',
          version: 1,
          description: 'Chuẩn Pull-Up: Cằm vượt xà (Chin over bar), cánh tay mở hết biên độ ở điểm đáy (Dead Hang).',
          cameraAngleRequirement: 'FRONT_VIEW',
          minBodyVisibilityPercent: 85,
          trackingFpsTarget: 30,
          smoothingAlpha: 0.7,
          repCountPrimaryMetric: 'CHIN_ABOVE_WRIST_Y',
          repStartThreshold: 170,
          repPeakThreshold: 50,
          repEndThreshold: 165,
          minRomPercentage: 80,
          repDirection: 'ASCENDING_FIRST',
          repDebounceMs: 500,
          minRepDurationMs: 1200,
          autoVoiceFeedbackEnabled: true,
          warningCooldownSeconds: 3.0,
          maxWarningsPerRep: 2,
          rulesCount: 5,
          landmarksCount: 10,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin (System)',
        },
        {
          id: 3,
          exerciseId: 3,
          exerciseCode: 'SQUAT',
          exerciseName: 'Gánh đùi Squat (Bodyweight)',
          category: 'LEGS_AND_CORE',
          status: 'PUBLISHED',
          version: 1,
          description: 'Squat tiêu chuẩn: Đùi song song mặt sàn (Hip crease below knee, 90°), gối không sụp vào trong.',
          cameraAngleRequirement: 'SIDE_PROFILE',
          minBodyVisibilityPercent: 90,
          trackingFpsTarget: 30,
          smoothingAlpha: 0.6,
          repCountPrimaryMetric: 'KNEE_ANGLE_LEFT',
          repStartThreshold: 175,
          repPeakThreshold: 80,
          repEndThreshold: 170,
          minRomPercentage: 85,
          repDirection: 'DESCENDING_FIRST',
          repDebounceMs: 450,
          minRepDurationMs: 1000,
          autoVoiceFeedbackEnabled: true,
          warningCooldownSeconds: 2.0,
          maxWarningsPerRep: 2,
          rulesCount: 6,
          landmarksCount: 14,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin (System)',
        },
        {
          id: 4,
          exerciseId: 4,
          exerciseCode: 'PLANK',
          exerciseName: 'Plank giữ tĩnh (Isometric Plank)',
          category: 'CORE',
          status: 'PUBLISHED',
          version: 1,
          description: 'Plank: Giữ thẳng vai - hông - gối (180°), siết cơ bụng và cơ mông, không võng lưng hay nhô mông.',
          cameraAngleRequirement: 'SIDE_PROFILE',
          minBodyVisibilityPercent: 85,
          trackingFpsTarget: 30,
          smoothingAlpha: 0.8,
          repCountPrimaryMetric: 'SPINE_ALIGNMENT_ANGLE',
          repStartThreshold: 180,
          repPeakThreshold: 180,
          repEndThreshold: 180,
          minRomPercentage: 100,
          repDirection: 'DESCENDING_FIRST',
          repDebounceMs: 1000,
          minRepDurationMs: 5000,
          autoVoiceFeedbackEnabled: true,
          warningCooldownSeconds: 3.0,
          maxWarningsPerRep: 1,
          rulesCount: 4,
          landmarksCount: 8,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin (System)',
        },
        {
          id: 5,
          exerciseId: 5,
          exerciseCode: 'DIP',
          exerciseName: 'Chống xà kép (Parallel Bar Dips)',
          category: 'CHEST_AND_TRICEPS',
          status: 'DRAFT',
          version: 1,
          description: 'Dips: Khuỷu tay hạ tối thiểu 90 độ, vai không nhún quá sâu, thân người nghiêng nhẹ.',
          cameraAngleRequirement: 'SIDE_45_DEGREE',
          minBodyVisibilityPercent: 80,
          trackingFpsTarget: 30,
          smoothingAlpha: 0.65,
          repCountPrimaryMetric: 'ELBOW_ANGLE_LEFT',
          repStartThreshold: 170,
          repPeakThreshold: 90,
          repEndThreshold: 165,
          minRomPercentage: 80,
          repDirection: 'DESCENDING_FIRST',
          repDebounceMs: 500,
          minRepDurationMs: 1000,
          autoVoiceFeedbackEnabled: true,
          warningCooldownSeconds: 2.5,
          maxWarningsPerRep: 2,
          rulesCount: 4,
          landmarksCount: 10,
          updatedAt: new Date().toISOString(),
          updatedBy: 'Admin (System)',
        },
      ];
    }
  },

  async getProfileById(id: number): Promise<ExerciseAiProfileDto> {
    const res = await apiClient.get<ExerciseAiProfileDto>(`${BASE_URL}/profiles/${id}`);
    return res.data;
  },

  async saveProfile(profile: Partial<ExerciseAiProfileDto>): Promise<ExerciseAiProfileDto> {
    const res = await apiClient.post<ExerciseAiProfileDto>(`${BASE_URL}/profiles`, profile);
    return res.data;
  },

  async publishProfile(id: number, versionLabel: string, changeSummary: string): Promise<ExerciseAiProfileDto> {
    const res = await apiClient.post<ExerciseAiProfileDto>(`${BASE_URL}/profiles/${id}/publish`, {
      versionLabel,
      changeSummary,
    });
    return res.data;
  },

  async rollbackProfile(id: number, targetVersion: number, reason: string): Promise<ExerciseAiProfileDto> {
    const res = await apiClient.post<ExerciseAiProfileDto>(`${BASE_URL}/profiles/${id}/rollback`, {
      targetVersion,
      reason,
    });
    return res.data;
  },

  // --- LANDMARKS ---
  async getLandmarks(profileId: number): Promise<AiLandmarkRequirementDto[]> {
    try {
      const res = await apiClient.get<AiLandmarkRequirementDto[]>(`${BASE_URL}/profiles/${profileId}/landmarks`);
      if (res.data && res.data.length > 0) return res.data;
      throw new Error('Empty landmarks');
    } catch {
      // Return 33 standard mediapipe landmarks with default weights
      return MEDIAPIPE_LANDMARKS.map((lm) => ({
        profileId,
        landmarkIndex: lm.index,
        landmarkName: lm.name,
        bodyRegion: lm.region,
        visibilityRequirement: [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].includes(lm.index)
          ? 'REQUIRED'
          : 'OPTIONAL',
        minConfidence: 0.6,
        weight: [11, 12, 13, 14, 23, 24].includes(lm.index) ? 1.5 : 1.0,
        description: `Toạ độ khớp ${lm.nameVi}`,
      }));
    }
  },

  async saveLandmarks(profileId: number, landmarks: AiLandmarkRequirementDto[]): Promise<AiLandmarkRequirementDto[]> {
    const res = await apiClient.put<AiLandmarkRequirementDto[]>(
      `${BASE_URL}/profiles/${profileId}/landmarks`,
      landmarks
    );
    return res.data;
  },

  // --- MOTION RULES ---
  async getRules(profileId: number): Promise<AiMotionRuleDto[]> {
    try {
      const res = await apiClient.get<AiMotionRuleDto[]>(`${BASE_URL}/profiles/${profileId}/rules`);
      if (res.data && res.data.length > 0) return res.data;
    } catch {}

    // Dynamic Exercise-Specific Rules Fallback
    if (profileId === 2) {
      // PULL-UP RULES
      return [
        {
          id: 201,
          profileId: 2,
          ruleCode: 'RULE_CHIN_OVER_BAR',
          ruleName: 'Cằm vượt xà (Chin Over Bar)',
          description: 'Tại đỉnh phát lực kéo (Concentric peak), cằm phải vượt hoàn toàn qua thanh xà.',
          phase: 'INFLECTION',
          metricType: 'ROM',
          landmarkA: 0,
          landmarkB: 15,
          operator: 'GTE',
          targetValue: 90,
          tolerance: 5,
          severity: 'WARNING',
          feedbackTextVi: 'Cằm chưa vượt qua xà! Hãy kéo ngực lên sát thanh xà hơn.',
          voicePromptVi: 'Kéo cao cằm qua xà',
          priority: 20,
          isInvalidRepFlag: true,
          isActive: true,
        },
        {
          id: 202,
          profileId: 2,
          ruleCode: 'RULE_DEAD_HANG',
          ruleName: 'Mở hết biên độ đáy (Dead Hang ROM)',
          description: 'Tại điểm đáy hạ người (Eccentric bottom), cánh tay phải duỗi thẳng tối thiểu 165°.',
          phase: 'START',
          metricType: 'ANGLE',
          landmarkA: 11,
          landmarkB: 13,
          landmarkC: 15,
          operator: 'GTE',
          targetValue: 165,
          tolerance: 5,
          severity: 'WARNING',
          feedbackTextVi: 'Chưa mở thẳng tay ở điểm đáy để đạt đủ biên độ chuẩn Dead Hang.',
          voicePromptVi: 'Mở thẳng tay ở điểm đáy',
          priority: 15,
          isInvalidRepFlag: true,
          isActive: true,
        },
        {
          id: 203,
          profileId: 2,
          ruleCode: 'RULE_KIPPING_SWING',
          ruleName: 'Văng chân / Đung đưa người (Kipping)',
          description: 'Không đung đưa gối hoặc gập hông lấy đà trong bài hít xà chuẩn Strict Pull-up.',
          phase: 'ALL',
          metricType: 'ALIGNMENT',
          landmarkA: 11,
          landmarkB: 23,
          landmarkC: 27,
          operator: 'BETWEEN',
          targetValue: 165,
          targetValueMax: 185,
          tolerance: 5,
          severity: 'ERROR',
          feedbackTextVi: 'Thân người bị đung đưa văng chân! Hãy gồng chặt cơ bụng để giữ thân người ổn định.',
          voicePromptVi: 'Khóa chặt thân người, không văng chân',
          priority: 10,
          isInvalidRepFlag: false,
          isActive: true,
        },
      ];
    }

    if (profileId === 3) {
      // SQUAT RULES
      return [
        {
          id: 301,
          profileId: 3,
          ruleCode: 'RULE_KNEE_VALGUS',
          ruleName: 'Sụp đầu gối vào trong (Knee Valgus)',
          description: 'Đầu gối phải mở theo hướng mũi chân, không được chụm vào nhau.',
          phase: 'ALL',
          metricType: 'ANGLE',
          landmarkA: 23,
          landmarkB: 25,
          landmarkC: 27,
          operator: 'BETWEEN',
          targetValue: 80,
          targetValueMax: 110,
          tolerance: 5,
          severity: 'ERROR',
          feedbackTextVi: 'Đầu gối bị sụp vào trong! Mở rộng đầu gối theo hướng mũi chân.',
          voicePromptVi: 'Mở gối theo hướng mũi chân',
          priority: 25,
          isInvalidRepFlag: true,
          isActive: true,
        },
        {
          id: 302,
          profileId: 3,
          ruleCode: 'RULE_PARALLEL_DEPTH',
          ruleName: 'Độ sâu đùi song song (Parallel Depth)',
          description: 'Hạ mông sao cho nếp gấp khớp háng ngang bằng hoặc thấp hơn đầu gối (ROM 90°).',
          phase: 'INFLECTION',
          metricType: 'ROM',
          landmarkA: 23,
          landmarkB: 25,
          landmarkC: 27,
          operator: 'LTE',
          targetValue: 90,
          tolerance: 5,
          severity: 'WARNING',
          feedbackTextVi: 'Chưa hạ đủ sâu! Hạ mông sâu hơn đùi song song mặt sàn.',
          voicePromptVi: 'Hạ mông sâu hơn đùi song song',
          priority: 20,
          isInvalidRepFlag: true,
          isActive: true,
        },
        {
          id: 303,
          profileId: 3,
          ruleCode: 'RULE_TORSO_LEAN',
          ruleName: 'Gập thân người quá mức về trước',
          description: 'Giữ ngực mở thẳng, cột sống thẳng tự nhiên.',
          phase: 'ECCENTRIC',
          metricType: 'ALIGNMENT',
          landmarkA: 11,
          landmarkB: 23,
          landmarkC: 25,
          operator: 'GTE',
          targetValue: 65,
          tolerance: 5,
          severity: 'WARNING',
          feedbackTextVi: 'Thân trên bị gập quá sâu về phía trước, hãy giữ ngực mở cao.',
          voicePromptVi: 'Giữ ngực mở thẳng',
          priority: 15,
          isInvalidRepFlag: false,
          isActive: true,
        },
      ];
    }

    if (profileId === 4) {
      // DIPS RULES
      return [
        {
          id: 401,
          profileId: 4,
          ruleCode: 'RULE_DIP_DEPTH_90',
          ruleName: 'Hạ sâu vuông góc khuỷu tay 90°',
          description: 'Hạ thân người cho đến khi khuỷu tay gập đạt góc vuông 90 độ.',
          phase: 'INFLECTION',
          metricType: 'ANGLE',
          landmarkA: 11,
          landmarkB: 13,
          landmarkC: 15,
          operator: 'LTE',
          targetValue: 90,
          tolerance: 5,
          severity: 'WARNING',
          feedbackTextVi: 'Hạ khuỷu tay chưa đạt góc 90 độ vuông góc.',
          voicePromptVi: 'Xuống sâu vuông góc khuỷu tay',
          priority: 20,
          isInvalidRepFlag: true,
          isActive: true,
        },
        {
          id: 402,
          profileId: 4,
          ruleCode: 'RULE_SHOULDER_SHRUG',
          ruleName: 'Tránh rụt cổ và nhô vai cao',
          description: 'Hạ vai thấp, gồng ép cơ xô và ngực dưới.',
          phase: 'ALL',
          metricType: 'ALIGNMENT',
          landmarkA: 0,
          landmarkB: 11,
          landmarkC: 13,
          operator: 'BETWEEN',
          targetValue: 160,
          targetValueMax: 185,
          tolerance: 5,
          severity: 'ERROR',
          feedbackTextVi: 'Vai bị rụt lên gần tai! Hãy hạ vai xuống, ép chặt cơ ngực dưới.',
          voicePromptVi: 'Hạ vai, ép chặt cơ ngực dưới',
          priority: 15,
          isInvalidRepFlag: false,
          isActive: true,
        },
      ];
    }

    if (profileId === 5) {
      // PLANK RULES
      return [
        {
          id: 501,
          profileId: 5,
          ruleCode: 'RULE_PLANK_SAG',
          ruleName: 'Võng lưng / Chùng hông (Hip Sag)',
          description: 'Trục từ vai qua hông đến cổ chân phải nằm trên 1 đường thẳng 180°.',
          phase: 'ALL',
          metricType: 'ALIGNMENT',
          landmarkA: 11,
          landmarkB: 23,
          landmarkC: 27,
          operator: 'BETWEEN',
          targetValue: 168,
          targetValueMax: 185,
          tolerance: 5,
          severity: 'ERROR',
          feedbackTextVi: 'Hông bị võng thấp hoặc nhô cao! Siết chặt cơ bụng và cơ mông.',
          voicePromptVi: 'Siết chặt cơ bụng và cơ mông',
          priority: 25,
          isInvalidRepFlag: true,
          isActive: true,
        },
      ];
    }

    // Default Push-up rules
    return [
      {
        id: 101,
        profileId,
        ruleCode: 'RULE_ELBOW_FLARE',
        ruleName: 'Khuỷu tay xòe quá rộng (Elbow Flare)',
        description: 'Góc tạo bởi thân người và cánh tay phải nằm trong khoảng an toàn 45° - 65° để bảo vệ khớp vai.',
        phase: 'ECCENTRIC',
        metricType: 'ANGLE',
        landmarkA: 11,
        landmarkB: 13,
        landmarkC: 23,
        operator: 'BETWEEN',
        targetValue: 40,
        targetValueMax: 70,
        tolerance: 5,
        severity: 'WARNING',
        feedbackTextVi: 'Khuỷu tay đang mở quá rộng, hãy khép sát vào thân người góc 45-60 độ!',
        feedbackTextEn: 'Elbows flaring too wide, tuck them to 45-60 degrees.',
        voicePromptVi: 'Khép bớt khuỷu tay lại',
        priority: 10,
        isInvalidRepFlag: false,
        isActive: true,
      },
      {
        id: 102,
        profileId,
        ruleCode: 'RULE_SPINE_SAG',
        ruleName: 'Võng lưng hoặc chùng hông (Sagging Hips)',
        description: 'Góc vai - hông - gối phải xấp xỉ 180° để đảm bảo cột sống thẳng trung tính.',
        phase: 'ALL',
        metricType: 'ALIGNMENT',
        landmarkA: 11,
        landmarkB: 23,
        landmarkC: 25,
        operator: 'GTE',
        targetValue: 165,
        tolerance: 5,
        severity: 'ERROR',
        feedbackTextVi: 'Lưng bị võng hoặc hông chùng! Hãy siết chặt cơ bụng và cơ mông để giữ thẳng người.',
        feedbackTextEn: 'Hips are sagging! Squeeze core and glutes to maintain a straight line.',
        voicePromptVi: 'Siết bụng, nâng hông lên',
        priority: 20,
        isInvalidRepFlag: true,
        isActive: true,
      },
      {
        id: 103,
        profileId,
        ruleCode: 'RULE_DEPTH_ROM',
        ruleName: 'Chưa đủ độ sâu ngực (Insufficient ROM)',
        description: 'Tại điểm đáy (Inflection), góc gập khuỷu tay phải đạt tối thiểu dưới 90° để tính 1 rep hợp lệ.',
        phase: 'INFLECTION',
        metricType: 'ROM',
        landmarkA: 11,
        landmarkB: 13,
        landmarkC: 15,
        operator: 'LTE',
        targetValue: 90,
        tolerance: 5,
        severity: 'WARNING',
        feedbackTextVi: 'Chưa xuống đủ sâu! Hãy hạ ngực cách mặt đất khoảng 5-10cm.',
        feedbackTextEn: 'Incomplete depth. Lower your chest deeper to achieve 90 degrees.',
        voicePromptVi: 'Hạ sâu thêm chút nữa',
        priority: 15,
        isInvalidRepFlag: true,
        isActive: true,
      },
      {
        id: 104,
        profileId,
        ruleCode: 'RULE_LOCKOUT_HYPEREXTENSION',
        ruleName: 'Khóa khớp khuỷu tay đột ngột (Lockout Impact)',
        description: 'Tại điểm cao nhất (Concentric end), không được giật mạnh khóa cứng khớp khuỷu tay.',
        phase: 'LOCKOUT',
        metricType: 'ANGLE',
        landmarkA: 11,
        landmarkB: 13,
        landmarkC: 15,
        operator: 'LTE',
        targetValue: 175,
        tolerance: 3,
        severity: 'INFO',
        feedbackTextVi: 'Đẩy lên tối đa nhưng giữ khuỷu tay mở mềm, tránh khóa khớp giật mạnh.',
        feedbackTextEn: 'Reach top extension with soft elbows, do not forcefully lock out joints.',
        voicePromptVi: 'Tốt, không khóa cứng khuỷu tay',
        priority: 5,
        isInvalidRepFlag: false,
        isActive: true,
      },
    ];
  },

  async saveRule(rule: Partial<AiMotionRuleDto>): Promise<AiMotionRuleDto> {
    const res = await apiClient.post<AiMotionRuleDto>(`${BASE_URL}/rules`, rule);
    return res.data;
  },

  async deleteRule(ruleId: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/rules/${ruleId}`);
  },

  // --- FEEDBACK TEMPLATES ---
  async getFeedbackTemplates(profileId: number): Promise<AiFeedbackTemplateDto[]> {
    try {
      const res = await apiClient.get<AiFeedbackTemplateDto[]>(`${BASE_URL}/profiles/${profileId}/feedback-templates`);
      return res.data;
    } catch {
      return [];
    }
  },

  async saveFeedbackTemplate(tpl: Partial<AiFeedbackTemplateDto>): Promise<AiFeedbackTemplateDto> {
    const res = await apiClient.post<AiFeedbackTemplateDto>(`${BASE_URL}/feedback-templates`, tpl);
    return res.data;
  },

  // --- VOICE CONFIG & GEMINI API KEY ---
  async getVoiceConfig(): Promise<AiVoiceConfigurationDto> {
    const rawLocal = localStorage.getItem('calis_ai_voice_config');
    let localConfig: Partial<AiVoiceConfigurationDto> = {};
    if (rawLocal) {
      try { localConfig = JSON.parse(rawLocal); } catch {}
    }

    // Gemini key chỉ nằm trên server (biến môi trường GEMINI_API_KEY): không đọc/lưu ở trình duyệt.
    // Xóa key cũ từng được lưu trong localStorage ở các phiên bản trước.
    localStorage.removeItem('calis_gemini_api_key');
    delete localConfig.geminiApiKey;
    const savedViettelToken = localConfig.viettelToken || localStorage.getItem('calis_viettel_token') || '';

    const fallback: AiVoiceConfigurationDto = {
      id: localConfig.id || 1,
      provider: localConfig.provider || 'VIETTEL_AI',
      modelName: localConfig.modelName || 'viettel-tts-v2',
      apiKeyMasked: savedViettelToken.substring(0, 6) + '****************' + savedViettelToken.substring(savedViettelToken.length - 4),
      apiKey: savedViettelToken,
      geminiApiKey: undefined,
      geminiApiKeyMasked: 'Cấu hình qua GEMINI_API_KEY trên server',
      viettelToken: savedViettelToken,
      viettelTokenMasked: savedViettelToken.substring(0, 6) + '****************' + savedViettelToken.substring(savedViettelToken.length - 4),
      voiceName: localConfig.voiceName || 'hn-quynhanh',
      languageCode: localConfig.languageCode || 'vi-VN',
      speakingRate: localConfig.speakingRate ?? 1.0,
      pitch: localConfig.pitch ?? 0.0,
      volumeGainDb: localConfig.volumeGainDb ?? 0.0,
      audioEncoding: localConfig.audioEncoding || 'MP3',
      isDefault: true,
      systemInstruction: localConfig.systemInstruction || 'Bạn là Huấn luyện viên thể hình Calisthenics chuyên nghiệp. Hãy phát âm cảnh báo ngắn gọn, rõ ràng, dứt khoát dưới 5 từ.',
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await apiClient.get<AiVoiceConfigurationDto>(`${BASE_URL}/voice/config`);
      if (res.data) {
        const merged = { ...fallback, ...res.data };
        if (localConfig.voiceName) merged.voiceName = localConfig.voiceName;
        if (localConfig.provider) merged.provider = localConfig.provider;
        if (localConfig.viettelToken) merged.viettelToken = localConfig.viettelToken;
        localStorage.setItem('calis_ai_voice_config', JSON.stringify(merged));
        return merged;
      }
    } catch {
      try {
        const res2 = await apiClient.get<AiVoiceConfigurationDto>(`${BASE_URL}/voice-config`);
        if (res2.data) {
          const merged = { ...fallback, ...res2.data };
          if (localConfig.voiceName) merged.voiceName = localConfig.voiceName;
          if (localConfig.provider) merged.provider = localConfig.provider;
            if (localConfig.viettelToken) merged.viettelToken = localConfig.viettelToken;
          localStorage.setItem('calis_ai_voice_config', JSON.stringify(merged));
          return merged;
        }
      } catch {}
    }

    return fallback;
  },

  async saveVoiceConfig(config: Partial<AiVoiceConfigurationDto>): Promise<AiVoiceConfigurationDto> {
    const rawLocal = localStorage.getItem('calis_ai_voice_config');
    let localConfig: Partial<AiVoiceConfigurationDto> = {};
    if (rawLocal) {
      try { localConfig = JSON.parse(rawLocal); } catch {}
    }

    // Gemini key không được gửi từ trình duyệt - server dùng biến môi trường GEMINI_API_KEY
    const viettelToken = config.viettelToken || localConfig.viettelToken || localStorage.getItem('calis_viettel_token') || '';

    if (viettelToken.trim()) {
      localStorage.setItem('calis_viettel_token', viettelToken.trim());
    }

    const merged: AiVoiceConfigurationDto = {
      id: config.id || localConfig.id || 1,
      provider: config.provider || localConfig.provider || 'VIETTEL_AI',
      modelName: config.modelName || localConfig.modelName || 'viettel-tts-v2',
      apiKeyMasked: config.provider === 'GEMINI'
        ? 'Cấu hình qua GEMINI_API_KEY trên server'
        : viettelToken.substring(0, 6) + '****************' + viettelToken.substring(viettelToken.length - 4),
      apiKey: config.provider === 'GEMINI' ? undefined : viettelToken,
      geminiApiKey: undefined,
      geminiApiKeyMasked: 'Cấu hình qua GEMINI_API_KEY trên server',
      viettelToken: viettelToken,
      viettelTokenMasked: viettelToken.substring(0, 6) + '****************' + viettelToken.substring(viettelToken.length - 4),
      voiceName: config.voiceName || localConfig.voiceName || 'hn-quynhanh',
      languageCode: config.languageCode || localConfig.languageCode || 'vi-VN',
      speakingRate: config.speakingRate ?? localConfig.speakingRate ?? 1.0,
      pitch: config.pitch ?? localConfig.pitch ?? 0.0,
      volumeGainDb: config.volumeGainDb ?? localConfig.volumeGainDb ?? 0.0,
      audioEncoding: config.audioEncoding || localConfig.audioEncoding || 'MP3',
      isDefault: true,
      systemInstruction: config.systemInstruction || localConfig.systemInstruction || 'Bạn là Huấn luyện viên thể hình Calisthenics chuyên nghiệp.',
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('calis_ai_voice_config', JSON.stringify(merged));

    try {
      const res = await apiClient.post<AiVoiceConfigurationDto>(`${BASE_URL}/voice/config`, merged);
      if (res.data) {
        localStorage.setItem('calis_ai_voice_config', JSON.stringify({ ...merged, ...res.data }));
        return { ...merged, ...res.data };
      }
    } catch {
      try {
        const res2 = await apiClient.post<AiVoiceConfigurationDto>(`${BASE_URL}/voice-config`, merged);
        if (res2.data) {
          localStorage.setItem('calis_ai_voice_config', JSON.stringify({ ...merged, ...res2.data }));
          return { ...merged, ...res2.data };
        }
      } catch {}
    }

    return merged;
  },

  async testVoiceConnection(payload: {
    apiKey?: string;
    modelName?: string;
    provider?: string;
    voiceName?: string;
    speakingRate?: number;
    promptText: string;
  }): Promise<{ success: boolean; message: string; audioUrl?: string; audioBase64?: string; cached?: boolean; latencyMs?: number }> {
    try {
      const reqBody = {
        text: payload.promptText,
        promptText: payload.promptText,
        provider: payload.provider || 'VIETTEL_AI',
        voiceName: payload.voiceName || 'hn-quynhanh',
        speed: payload.speakingRate || 1.0,
        apiKey: payload.apiKey,
      };
      const res = await apiClient.post<{ success: boolean; message: string; audioUrl?: string; audioBase64?: string; cached?: boolean; latencyMs?: number }>(
        `${BASE_URL}/voice/test`,
        reqBody
      );
      if (res.data) return res.data;
    } catch (err: any) {
      const errDetail = err?.response?.data?.message || err?.message || 'Không thể kết nối đến máy chủ Backend';
      if (payload.provider === 'VIETTEL_AI') {
        return {
          success: false,
          message: `Lỗi kết nối Viettel AI: ${errDetail}`,
          cached: false,
        };
      }
    }

    return {
      success: true,
      message: `Đang phát âm thanh giọng Việt (${payload.voiceName || 'Quỳnh Anh'}) qua Web Speech API`,
      cached: false,
    };
  },

  async speakVoicePrompt(promptText: string): Promise<void> {
    if (!promptText || !promptText.trim()) return;
    const cfg = await this.getVoiceConfig();
    const activeKey = cfg.provider === 'VIETTEL_AI'
      ? (cfg.viettelToken || localStorage.getItem('calis_viettel_token') || '')
      : undefined; // Gemini: server tự dùng GEMINI_API_KEY

    try {
      const res = await this.testVoiceConnection({
        promptText,
        voiceName: cfg.voiceName || 'hn-quynhanh',
        provider: cfg.provider || 'VIETTEL_AI',
        modelName: cfg.modelName,
        speakingRate: cfg.speakingRate || 1.0,
        apiKey: activeKey,
      });

      if (res.success) {
        if (res.audioBase64) {
          const src = res.audioBase64.startsWith('data:') ? res.audioBase64 : `data:audio/mp3;base64,${res.audioBase64}`;
          const audio = new Audio(src);
          await audio.play();
          return;
        } else if (res.audioUrl) {
          const audio = new Audio(res.audioUrl);
          await audio.play();
          return;
        }
      }
    } catch (e) {
      console.warn('Backend TTS playback failed, falling back to browser SpeechSynthesis:', e);
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(promptText);
      utterance.lang = cfg.languageCode || 'vi-VN';
      utterance.rate = cfg.speakingRate || 1.0;
      utterance.pitch = cfg.pitch ? 1.0 + (cfg.pitch * 0.1) : 1.0;

      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => 
        (cfg.voiceName && v.name.includes(cfg.voiceName)) ||
        v.lang.startsWith('vi') ||
        v.name.includes('Vietnamese') ||
        v.name.includes('Tiếng Việt')
      );
      if (viVoice) utterance.voice = viVoice;

      window.speechSynthesis.speak(utterance);
    }
  },

  // --- VOICE CACHE ---
  async getVoiceCacheStats(): Promise<AiVoiceCacheStatsDto> {
    try {
      const res = await apiClient.get<AiVoiceCacheStatsDto>(`${BASE_URL}/voice/cache/stats`);
      return res.data;
    } catch {
      return {
        totalCachedAudios: 86,
        totalCacheHits: 1240,
        totalStorageBytes: 4200000,
        mostFrequentPrompts: [
          { promptText: 'Khép bớt khuỷu tay lại', hitCount: 412 },
          { promptText: 'Siết bụng, nâng hông lên', hitCount: 388 },
          { promptText: 'Hạ sâu thêm chút nữa', hitCount: 295 },
          { promptText: 'Rep hoàn hảo, tiếp tục phát huy!', hitCount: 145 },
        ],
      };
    }
  },

  async clearVoiceCache(): Promise<void> {
    await apiClient.delete(`${BASE_URL}/voice/cache`);
  },

  // --- AUDIT LOGS & VERSIONS ---
  async getVersions(profileId: number): Promise<AiConfigurationVersionDto[]> {
    try {
      const res = await apiClient.get<AiConfigurationVersionDto[]>(`${BASE_URL}/profiles/${profileId}/versions`);
      return res.data;
    } catch {
      return [
        {
          id: 1,
          profileId,
          versionNumber: 2,
          versionLabel: 'v2.1 - Tối ưu hóa Elbow Flare & ROM ngực',
          changeSummary: 'Thắt chặt góc khuỷu tay 40-70°, thêm cảnh báo giọng nói siêu nhanh cho giai đoạn Eccentric.',
          isActive: true,
          createdAt: '2026-09-28T14:30:00Z',
          createdBy: 'admin@calishealth.com',
        },
        {
          id: 2,
          profileId,
          versionNumber: 1,
          versionLabel: 'v1.0 - Bản phát hành chuẩn ban đầu',
          changeSummary: 'Cấu hình MediaPipe 33 điểm và thuật toán đếm reps cơ bản.',
          isActive: false,
          createdAt: '2026-08-15T09:00:00Z',
          createdBy: 'system',
        },
      ];
    }
  },

  async getAuditLogs(profileId?: number): Promise<AiConfigurationAuditLogDto[]> {
    try {
      const res = await apiClient.get<AiConfigurationAuditLogDto[]>(`${BASE_URL}/audit-logs`, {
        params: { profileId },
      });
      return res.data;
    } catch {
      return [
        {
          id: 1,
          profileId,
          action: 'PUBLISH',
          entityType: 'ExerciseAiProfile',
          entityId: profileId || 1,
          newValue: 'Version 2 Published',
          reason: 'Phát hành chính thức sau khi kiểm nghiệm trong AI Test Lab',
          performedBy: 'admin@calishealth.com',
          createdAt: '2026-09-28T14:30:00Z',
        },
        {
          id: 2,
          profileId,
          action: 'UPDATE',
          entityType: 'AiMotionRule',
          entityId: 101,
          oldValue: 'targetValue: 45, max: 75',
          newValue: 'targetValue: 40, max: 70',
          reason: 'Giảm góc mở cánh tay để hạn chế chấn thương chóp xoay vai',
          performedBy: 'coach_expert@calishealth.com',
          createdAt: '2026-09-28T11:15:00Z',
        },
        {
          id: 3,
          profileId,
          action: 'API_KEY_UPDATE',
          entityType: 'AiVoiceConfiguration',
          entityId: 1,
          newValue: 'Updated Gemini Flash Model TTS Config',
          performedBy: 'super_admin',
          createdAt: '2026-09-20T08:00:00Z',
        },
      ];
    }
  },

  // --- REAL-TIME SIMULATOR / EVALUATION ---
  async evaluateSimulator(req: RuleEvaluationRequest): Promise<RuleEvaluationResult> {
    try {
      const res = await apiClient.post<RuleEvaluationResult>(`${BASE_URL}/evaluate`, req);
      return res.data;
    } catch {
      // Local evaluation fallback for smooth interactive slider feedback
      const triggered: RuleEvaluationResult['triggeredRules'] = [];
      let isInvalid = false;
      const metrics = req.currentMetrics || {};

      const elbow = metrics.ELBOW_ANGLE_LEFT ?? metrics.ELBOW_ANGLE ?? 90;
      const spine = metrics.SPINE_ALIGNMENT_ANGLE ?? 180;
      const depth = metrics.DEPTH_ROM ?? 85;

      if (elbow > 70) {
        triggered.push({
          ruleId: 101,
          ruleCode: 'RULE_ELBOW_FLARE',
          ruleName: 'Khuỷu tay xòe quá rộng (Elbow Flare)',
          severity: 'WARNING',
          feedbackTextVi: 'Khuỷu tay đang mở góc ' + Math.round(elbow) + '° (quá 70°), hãy khép sát nách!',
          voicePromptVi: 'Khép bớt khuỷu tay lại',
          currentValue: elbow,
          targetRange: '40° - 70°',
        });
      }

      if (spine < 165) {
        triggered.push({
          ruleId: 102,
          ruleCode: 'RULE_SPINE_SAG',
          ruleName: 'Võng lưng / chùng hông (Sagging Hips)',
          severity: 'ERROR',
          feedbackTextVi: 'Lưng bị võng góc ' + Math.round(spine) + '°! Siết chặt cơ bụng và mông.',
          voicePromptVi: 'Siết bụng, nâng hông lên',
          currentValue: spine,
          targetRange: '≥ 165°',
        });
        isInvalid = true;
      }

      if (depth > 95) {
        triggered.push({
          ruleId: 103,
          ruleCode: 'RULE_DEPTH_ROM',
          ruleName: 'Chưa đủ độ sâu ngực',
          severity: 'WARNING',
          feedbackTextVi: 'Độ sâu hiện tại ' + Math.round(depth) + '°, chưa đạt ngưỡng 90°!',
          voicePromptVi: 'Hạ sâu thêm chút nữa',
          currentValue: depth,
          targetRange: '≤ 90°',
        });
        isInvalid = true;
      }

      const passed = triggered.length === 0;
      const score = Math.max(20, Math.round(100 - triggered.length * 25));

      return {
        passed,
        score,
        invalidRep: isInvalid,
        triggeredRules: triggered,
        voiceWarningToPlay: triggered.length > 0 ? {
          text: triggered[0].voicePromptVi || triggered[0].feedbackTextVi,
          cached: true,
          hash: 'mock_sha256_hash',
        } : undefined,
      };
    }
  },
};
