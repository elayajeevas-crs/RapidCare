export const EMERGENCY_NUMBER = '112'; // India single emergency number; make configurable per region
export const DISCLAIMER = 'Emergency guidance only - not a substitute for professional medical care. RapidCare does not replace emergency medical professionals.';

// Conservative, widely published first-aid points. Must be reviewed by a qualified medical professional before real-world use.
export const GUIDANCE: Record<string, { title: string; steps: string[]; avoid: string[] }> = {
  SNAKE_BITE: {
    title: 'Possible snake-bite emergency',
    steps: ['Seek professional medical care immediately - call emergency services and head to a suitable facility.', 'Keep the person calm and as still as possible.', 'Keep the bitten limb at a comfortable position, below or level with the heart if possible.', 'Remove rings, watches or tight items near the bite before swelling starts.', 'Note the time of the bite. Do not try to catch or handle the snake.'],
    avoid: ['Do not cut the wound or try to suck out venom.', 'Do not apply a tight tourniquet.', 'Do not delay travel to try home remedies.'],
  },
  INSECT_STING: {
    title: 'Possible poisonous insect-sting emergency',
    steps: ['Move away from the insects or scorpion to a safe place.', 'Call emergency services immediately if there is trouble breathing, swelling of face or throat, dizziness, or spreading symptoms.', 'If a stinger is visible, scrape it out quickly; wash the area with soap and water.', 'A cold pack wrapped in cloth may ease local pain and swelling.', 'Keep the person calm and watch them until professional care is reached.'],
    avoid: ['Do not squeeze the sting site.', 'Do not wait to see if symptoms worsen before seeking care.'],
  },
  OTHER: { title: 'Other emergency', steps: ['Call emergency services now.', 'You can still search for nearby healthcare facilities below.'], avoid: [] },
};
