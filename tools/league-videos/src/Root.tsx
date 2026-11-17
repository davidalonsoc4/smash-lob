import { Composition } from "remotion";
import { LigaFormato, TOTAL_FRAMES } from "./LigaFormato";
import { Bienvenida, BIENVENIDA_FRAMES, PRO_LEAGUE } from "./Bienvenida";
import { BienvenidaRapida, RAPIDA_FRAMES } from "./BienvenidaRapida";
import { Inscripcion, INSCRIPCION_FRAMES_FN } from "./Inscripcion";
import { Perfil, PERFIL_FRAMES_FN } from "./Perfil";
import { Resultado, RESULTADO_FRAMES_FN } from "./Resultado";
import { Presentacion, PRESENTACION_FRAMES_FN } from "./Presentacion";
import { Clasificacion, CLASIFICACION_FRAMES_FN } from "./Clasificacion";
import { Desbloqueo, DESBLOQUEO_FRAMES_FN } from "./Desbloqueo";
import { ChatLiga, CHAT_FRAMES_FN } from "./Chat";
import { Organiza, ORGANIZA_FRAMES_FN } from "./Organiza";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Bienvenida" component={Bienvenida} durationInFrames={BIENVENIDA_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="BienvenidaRapida" component={BienvenidaRapida} durationInFrames={RAPIDA_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="InscripcionSinCifras" component={Inscripcion} durationInFrames={INSCRIPCION_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="PerfilDisponibilidad" component={Perfil} durationInFrames={PERFIL_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="SubirResultado" component={Resultado} durationInFrames={RESULTADO_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="PresentacionApp" component={Presentacion} durationInFrames={PRESENTACION_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="ClasificacionMvp" component={Clasificacion} durationInFrames={CLASIFICACION_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="CuentaAtrasDesbloqueo" component={Desbloqueo} durationInFrames={DESBLOQUEO_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="ChatDeLaLiga" component={ChatLiga} durationInFrames={CHAT_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="OrganizaTuPartido" component={Organiza} durationInFrames={ORGANIZA_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="LigaFormato" component={LigaFormato} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
