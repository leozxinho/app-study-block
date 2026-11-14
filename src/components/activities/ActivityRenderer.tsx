import type { ActivityProps } from './shared/utils';
import { MultipleChoiceActivity } from './MultipleChoiceActivity';
import { CountingActivity } from './CountingActivity';
import { ColorIdentificationActivity } from './ColorIdentificationActivity';
import { MemoryActivity } from './MemoryActivity';
import { MatchingActivity } from './MatchingActivity';
import { OrderingActivity } from './OrderingActivity';
import { ShapeIdentificationActivity } from './ShapeIdentificationActivity';
import { LetterIdentificationActivity } from './LetterIdentificationActivity';
import { SequenceActivity } from './SequenceActivity';
import { ClickCorrectActivity } from './ClickCorrectActivity';
import { DragDropActivity } from './DragDropActivity';
import { CraftingActivity } from './CraftingActivity';
import { MiningMathActivity } from './MiningMathActivity';
import { WordBuilderActivity } from './WordBuilderActivity';
import { ShadowMatchActivity } from './ShadowMatchActivity';
import { BuildPatternActivity } from './BuildPatternActivity';
import { MathMobsActivity } from './MathMobsActivity';
import { ClockActivity } from './ClockActivity';
import { ReadingActivity } from './ReadingActivity';

/** Mostra o componente de cada tipo de atividade (o único lugar com este switch). */
export function ActivityRenderer(props: ActivityProps) {
  switch (props.activity.activity_type) {
    case 'counting':
      return <CountingActivity {...props} />;
    case 'color-identification':
      return <ColorIdentificationActivity {...props} />;
    case 'memory':
      return <MemoryActivity {...props} />;
    case 'matching':
      return <MatchingActivity {...props} />;
    case 'ordering':
      return <OrderingActivity {...props} />;
    case 'shape-identification':
      return <ShapeIdentificationActivity {...props} />;
    case 'letter-identification':
      return <LetterIdentificationActivity {...props} />;
    case 'sequence':
      return <SequenceActivity {...props} />;
    case 'click-correct':
      return <ClickCorrectActivity {...props} />;
    case 'drag-drop':
      return <DragDropActivity {...props} />;
    case 'crafting':
      return <CraftingActivity {...props} />;
    case 'mining-math':
      return <MiningMathActivity {...props} />;
    case 'word-builder':
      return <WordBuilderActivity {...props} />;
    case 'shadow-match':
      return <ShadowMatchActivity {...props} />;
    case 'build-pattern':
      return <BuildPatternActivity {...props} />;
    case 'math-mobs':
      return <MathMobsActivity {...props} />;
    case 'clock':
      return <ClockActivity {...props} />;
    case 'reading':
      return <ReadingActivity {...props} />;
    default:
      return <MultipleChoiceActivity {...props} />;
  }
}
