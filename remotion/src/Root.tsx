import React from 'react';
import {Composition, Still} from 'remotion';
import {Reel} from './Reel';
import {Prova} from './Prova';
import {Tutorial, TUT_FRAMES} from './Tutorial';
import {XReel, Capa, TOTAL} from './xr/XReel';
import {XReel3, Capa3, TOTAL30} from './xr/XReel3';
import {T12, TOTAL30 as T12_TOTAL} from './t12/T12';
import {ERReel, TOTAL30 as ER_TOTAL} from './er/ERReel';
import {DirA, DirB, DirC} from './news3/Direcao';
import {Radar3, TOTAL30 as R3_TOTAL} from './news3/Radar3';
import {Ganhos, TOTAL30 as G_TOTAL} from './news3/Ganhos';
import {Reel2, TOTAL30 as RE2_TOTAL} from './news3/Reel2';
import {News, TOTAL30 as NEWS_TOTAL} from './news/News';
import {Radar2, TOTAL30 as R2_TOTAL} from './news2/Radar2';

export const Root: React.FC = () => (
  <>
    <Composition id="Radar2" component={Radar2} durationInFrames={R2_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{blur: false, samples: 3, safe: false}} />
    <Composition id="News" component={News} durationInFrames={NEWS_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{blur: false, samples: 3, safe: false}} />
    <Composition id="ER" component={ERReel} durationInFrames={ER_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{blur: false, samples: 3, safe: false}} />
    <Composition id="T12" component={T12} durationInFrames={T12_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{blur: false, samples: 3, safe: false}} />
    {(['A', 'B', 'C'] as const).map((h) => (
      <Composition key={'3' + h} id={`X3${h}`} component={XReel3} durationInFrames={TOTAL30 * 2} fps={60} width={1080} height={1920}
        defaultProps={{hook: h, safe: false, blur: true}} />
    ))}
    <Still id="Capa3C" component={Capa3} width={1080} height={1920} defaultProps={{hook: 'C' as const}} />
    {(['A', 'B', 'C'] as const).map((h) => (
      <Composition key={h} id={`XReel${h}`} component={XReel} durationInFrames={TOTAL} fps={30} width={1080} height={1920}
        defaultProps={{hook: h, safe: false, blur: true}} />
    ))}
    <Still id="CapaA" component={Capa} width={1080} height={1920} defaultProps={{hook: 'A' as const}} />
    <Composition id="Tutorial01" component={Tutorial} durationInFrames={TUT_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Prova3D" component={Prova} durationInFrames={180} fps={30} width={1080} height={1920} />
    <Composition id="ReelIA" component={Reel} durationInFrames={540} fps={30} width={1080} height={1920} />
        <Still id="DirA" component={DirA} width={1080} height={1920} />
      <Still id="DirB" component={DirB} width={1080} height={1920} />
      <Still id="DirC" component={DirC} width={1080} height={1920} />
          <Composition id="Radar3" component={Radar3} durationInFrames={R3_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{safe: false}} />
          <Composition id="Ganhos" component={Ganhos} durationInFrames={G_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{safe: false}} />
          <Composition id="Reel2" component={Reel2} durationInFrames={RE2_TOTAL * 2} fps={60} width={1080} height={1920} defaultProps={{safe: false}} />
    </>
);
