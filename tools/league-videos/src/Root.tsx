import { DiaPartido, DIAPARTIDO_FRAMES } from "./DiaPartido";
import { Inscripcion2, INSCRIPCION2_FRAMES } from "./Inscripcion2";
import { PerfilV2, PERFIL2_FRAMES } from "./Perfil2";
import { OrganizaV2, ORGANIZA2_FRAMES } from "./Organiza2";
import { Reserva, RESERVA_FRAMES } from "./Reserva";
import { Gen12Instalar, GEN12_FRAMES } from "./Gen12";
import { Gen13Notificaciones, GEN13_FRAMES } from "./Gen13";
import { Gen01ComoFunciona, GEN01_FRAMES } from "./Gen01";
import { Gen03Primera, GEN03_FRAMES } from "./Gen03";
import { Gen05Sorteo, GEN05_FRAMES } from "./Gen05";
import { Gen06Resultado, GEN06_FRAMES } from "./Gen06";
import { Gen18Amistosos, GEN18_FRAMES } from "./Gen18";
import { Gen10Bolas, GEN10_FRAMES } from "./Gen10";
import { Gen15Apariencia, GEN15_FRAMES } from "./Gen15";
import { Gen02Puntuacion, GEN02_FRAMES } from "./Gen02";
import { Liga08Resultado, LIGA08_FRAMES } from "./Liga08";
import { Liga09Cuenta, LIGA09_FRAMES } from "./Liga09";
import { Liga10Clasificacion, LIGA10_FRAMES } from "./Liga10";
import { Liga11Amistosos, LIGA11_FRAMES } from "./Liga11";
import { Gen04Estados, GEN04_FRAMES } from "./Gen04";
import { Gen07Confirmar, GEN07_FRAMES } from "./Gen07";
import { Gen08Mvp, GEN08_FRAMES } from "./Gen08";
import { Gen09Aplazar, GEN09_FRAMES } from "./Gen09";
import { Gen11Pagos, GEN11_FRAMES } from "./Gen11";
import { Gen14Perfil, GEN14_FRAMES } from "./Gen14";
import { Gen16Estadisticas, GEN16_FRAMES } from "./Gen16";
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
    <Composition id="ReservaConfirmada" component={Reserva} durationInFrames={RESERVA_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="Gen12Instalar" component={Gen12Instalar} durationInFrames={GEN12_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen13Notificaciones" component={Gen13Notificaciones} durationInFrames={GEN13_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen01ComoFunciona" component={Gen01ComoFunciona} durationInFrames={GEN01_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen03Primera" component={Gen03Primera} durationInFrames={GEN03_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen05Sorteo" component={Gen05Sorteo} durationInFrames={GEN05_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen06Resultado" component={Gen06Resultado} durationInFrames={GEN06_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen18Amistosos" component={Gen18Amistosos} durationInFrames={GEN18_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen10Bolas" component={Gen10Bolas} durationInFrames={GEN10_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen15Apariencia" component={Gen15Apariencia} durationInFrames={GEN15_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen02Puntuacion" component={Gen02Puntuacion} durationInFrames={GEN02_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Liga08Resultado" component={Liga08Resultado} durationInFrames={LIGA08_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Liga09Cuenta" component={Liga09Cuenta} durationInFrames={LIGA09_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Liga10Clasificacion" component={Liga10Clasificacion} durationInFrames={LIGA10_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Liga11Amistosos" component={Liga11Amistosos} durationInFrames={LIGA11_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen04Estados" component={Gen04Estados} durationInFrames={GEN04_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen07Confirmar" component={Gen07Confirmar} durationInFrames={GEN07_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen08Mvp" component={Gen08Mvp} durationInFrames={GEN08_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen09Aplazar" component={Gen09Aplazar} durationInFrames={GEN09_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen11Pagos" component={Gen11Pagos} durationInFrames={GEN11_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen14Perfil" component={Gen14Perfil} durationInFrames={GEN14_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Gen16Estadisticas" component={Gen16Estadisticas} durationInFrames={GEN16_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="DiaPartido" component={DiaPartido} durationInFrames={DIAPARTIDO_FRAMES} fps={30} width={1080} height={1920} defaultProps={{ league: PRO_LEAGUE }} />
    <Composition id="LigaFormato" component={LigaFormato} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
  </>
);
