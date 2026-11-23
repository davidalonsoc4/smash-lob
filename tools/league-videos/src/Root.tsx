import { DiaPartido, DIAPARTIDO_FRAMES } from "./DiaPartido";
import { Inscripcion2, INSCRIPCION2_FRAMES } from "./Inscripcion2";
import { PerfilV2, PERFIL2_FRAMES } from "./Perfil2";
import { OrganizaV2, ORGANIZA2_FRAMES } from "./Organiza2";
import { Chat2, CHAT2_FRAMES } from "./Chat2";
import { Presentacion3, PRESENTACION3_FRAMES } from "./Presentacion3";
import { Presentacion2, PRESENTACION2_FRAMES } from "./Presentacion2";
import { Bienvenida2, BIENVENIDA2_FRAMES } from "./Bienvenida2";
import { BolasMuestra } from "./Bolas";
import { DemoAvatares, DemoGraficas, DEMO_AVATARES_FRAMES, DEMO_GRAFICAS_FRAMES } from "./Demos";
import { Reel3, REEL3_FRAMES } from "./Reel3";
import { Reel2, REEL2_FRAMES } from "./Reel2";
import { Miniatura } from "./Miniatura";
import { Reel1, REEL1_FRAMES } from "./Reel1";
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
import { Amistosos, AMISTOSOS_FRAMES_FN } from "./Amistosos";

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
    <Composition id="PartidosNormales" component={Amistosos} durationInFrames={AMISTOSOS_FRAMES_FN(PRO_LEAGUE)} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="InstagramReel1" component={Reel1} durationInFrames={REEL1_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Miniatura" component={Miniatura} durationInFrames={1} fps={30} width={1920} height={1080} defaultProps={{ kicker: "BIENVENIDA", title: "Así será\n*la liga*", logo: "pro-logo.png", num: "VÍDEO 01", badge: "PRO LEAGUE · TEMPORADA 1" }} />
    <Composition id="InstagramReel2" component={Reel2} durationInFrames={REEL2_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="InstagramReel3" component={Reel3} durationInFrames={REEL3_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DemoGraficas" component={DemoGraficas} durationInFrames={DEMO_GRAFICAS_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DemoAvatares" component={DemoAvatares} durationInFrames={DEMO_AVATARES_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="BolasMuestra" component={BolasMuestra} durationInFrames={1} fps={30} width={1600} height={1250} />
    <Composition id="BienvenidaV2" component={Bienvenida2} durationInFrames={BIENVENIDA2_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="PresentacionV2" component={Presentacion2} durationInFrames={PRESENTACION2_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="PresentacionV3" component={Presentacion3} durationInFrames={PRESENTACION3_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="ChatV2" component={Chat2} durationInFrames={CHAT2_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="InscripcionV2" component={Inscripcion2} durationInFrames={INSCRIPCION2_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="PerfilV2" component={PerfilV2} durationInFrames={PERFIL2_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="OrganizaV2" component={OrganizaV2} durationInFrames={ORGANIZA2_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="DiaPartido" component={DiaPartido} durationInFrames={DIAPARTIDO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="LigaFormato" component={LigaFormato} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
