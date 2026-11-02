import { TestBed } from '@angular/core/testing';
import { ScanFeedbackService } from './scan-feedback.service';

// Exercise actual playback requests and resumption, not just a mocked service.beep().
describe('Bip de confirmation', () => {
  let service: ScanFeedbackService;
  let media: { currentTime: number; preload: string; volume: number; load: jasmine.Spy; play: jasmine.Spy; pause: jasmine.Spy };
  let context: {
    state: AudioContextState; sampleRate: number; currentTime: number; destination: object;
    resume: jasmine.Spy; close: jasmine.Spy; createBuffer: jasmine.Spy; createBufferSource: jasmine.Spy;
    createOscillator: jasmine.Spy; createGain: jasmine.Spy;
  };
  let startTone: jasmine.Spy;
  let startSilence: jasmine.Spy;

  beforeEach(() => {
    media = { currentTime: 0, preload: '', volume: 1, load: jasmine.createSpy('load'), play: jasmine.createSpy('play').and.resolveTo(), pause: jasmine.createSpy('pause') };
    spyOn(window, 'Audio').and.returnValue(media as unknown as HTMLAudioElement);
    startTone = jasmine.createSpy('oscillator.start'); startSilence = jasmine.createSpy('silence.start');
    const gain = { gain: { setValueAtTime: () => {}, linearRampToValueAtTime: () => {} }, connect: () => {}, disconnect: () => {} };
    context = {
      state: 'suspended', sampleRate: 44100, currentTime: 0, destination: {},
      resume: jasmine.createSpy('resume').and.callFake(async () => { context.state = 'running'; }),
      close: jasmine.createSpy('close').and.resolveTo(), createBuffer: jasmine.createSpy('buffer').and.returnValue({}),
      createBufferSource: jasmine.createSpy('source').and.returnValue({ connect: () => {}, disconnect: () => {}, start: startSilence }),
      createOscillator: jasmine.createSpy('oscillator').and.returnValue({ frequency: { setValueAtTime: () => {} }, connect: () => {}, disconnect: () => {}, start: startTone, stop: () => {} }),
      createGain: jasmine.createSpy('gain').and.returnValue(gain),
    };
    spyOn(window, 'AudioContext').and.returnValue(context as unknown as AudioContext);
    TestBed.configureTestingModule({}); service = TestBed.inject(ScanFeedbackService);
  });

  it('lit le fichier audio même si Web Audio est suspendu', async () => {
    service.beep(); await Promise.resolve();
    expect(window.Audio).toHaveBeenCalledWith(jasmine.stringMatching(/audio\/scan-beep\.wav$/));
    expect(media.play).toHaveBeenCalledTimes(1);
    expect(startTone).not.toHaveBeenCalled();
  });
  it('reprend Web Audio si la lecture média est refusée', async () => {
    media.play.and.rejectWith(new DOMException('Playback blocked', 'NotAllowedError'));
    service.beep();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(context.resume).toHaveBeenCalled(); expect(startTone).toHaveBeenCalledTimes(1);
  });
  it('prépare silencieusement le son lors d’un toucher, sans bip supplémentaire', async () => {
    document.dispatchEvent(new Event('touchend'));
    await Promise.resolve();
    expect(context.resume).toHaveBeenCalled(); expect(startSilence).toHaveBeenCalled();
    expect(media.play).not.toHaveBeenCalled(); expect(startTone).not.toHaveBeenCalled();
  });
  it('ne joue pas de bip tardif après fermeture', async () => {
    media.play.and.rejectWith(new Error('Playback unavailable'));
    service.beep(); service.ngOnDestroy();
    await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
    expect(startTone).not.toHaveBeenCalled(); expect(media.pause).toHaveBeenCalled();
  });
});
