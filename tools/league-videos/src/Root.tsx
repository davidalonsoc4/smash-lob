import { Composition } from "remotion";
import { LigaFormato, TOTAL_FRAMES } from "./LigaFormato";
import { Bienvenida, BIENVENIDA_FRAMES, PRO_LEAGUE } from "./Bienvenida";
import { BienvenidaRapida, RAPIDA_FRAMES } from "./BienvenidaRapida";
import { Inscripcion, INSCRIPCION_FRAMES_FN } from "./Inscripcion";
import { Perfil, PERFIL_FRAMES_FN } from "./Perfil";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Bienvenida" component={Bienvenida} durationInFrames={BIENVENIDA_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="BienvenidaRapida" component={BienvenidaRapida} durationInFrames={RAPIDA_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="InscripcionSinCifras" component={Inscripcion} durationInFrames={INSCRIPCION_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="PerfilDisponibilidad" component={Perfil} durationInFrames={PERFIL_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="LigaFormato" component={LigaFormato} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
