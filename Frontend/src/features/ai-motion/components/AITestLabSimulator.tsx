import { LiveCameraView } from './LiveCameraView';
import type { ExerciseAiProfileDto } from '../types/aiMotion.types';

interface Props {
  profile: ExerciseAiProfileDto;
}

export function AITestLabSimulator({ profile }: Props) {
  return (
    <div className="space-y-4">
      {/* DIRECT LIVE MEDIAPIPE CAMERA & 33 LANDMARKS VISION TEST */}
      <LiveCameraView profile={profile} />
    </div>
  );
}
