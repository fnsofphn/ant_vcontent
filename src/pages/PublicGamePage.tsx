import { SectionHeader } from '@/components/ui/Primitives';
import { EvnSpcGameEmbed } from '@/components/game/EvnSpcGameEmbed';

export function PublicGamePage() {
  return (
    <div className="public-game-page">
      <SectionHeader
        eye="Public Game"
        title="EVNSPC Gamification"
        subtitle="Trang public cho học viên/QC truy cập trực tiếp mà không cần đăng nhập."
      />
      <EvnSpcGameEmbed className="public-game-shell" />
    </div>
  );
}
