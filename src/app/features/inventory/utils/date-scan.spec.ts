import { DateScanConsensus, dateFrameRegion } from './date-scan';

describe('Validation de la date en direct', () => {
  it('attend deux lectures fiables identiques', () => {
    const scan = new DateScanConsensus();
    expect(scan.observe(['2027-01-05'], 85)).toBeNull();
    expect(scan.observe(['2027-01-05'], 80)).toBe('2027-01-05');
  });
  it('refuse une lecture isolée ou contradictoire', () => {
    const scan = new DateScanConsensus();
    expect(scan.observe(['2027-01-05'], 90)).toBeNull();
    expect(scan.observe(['2027-01-06'], 90)).toBeNull();
    expect(scan.observe(['2027-01-05'], 90)).toBeNull();
  });
  it('conserve une date repérée malgré une image floue ou ambiguë', () => {
    const scan = new DateScanConsensus();
    scan.observe(['2027-01-05'], 90);
    scan.observe(['2027-01-05'], 20);
    expect(scan.candidate).toBe('2027-01-05');
    scan.observe(['2027-01-05', '2027-01-06'], 90);
    expect(scan.candidate).toBe('2027-01-05');
    expect(scan.observe(['2027-01-05'], 90)).toBe('2027-01-05');
  });
  it('tolère plusieurs images sans date entre deux lectures fiables', () => {
    const scan = new DateScanConsensus();
    scan.observe(['2027-01-05'], 85);
    scan.observe([], 0); scan.observe([], 0); scan.observe([], 0);
    expect(scan.observe(['2027-01-05'], 80)).toBe('2027-01-05');
  });
  it('demande davantage de lectures quand la confiance est modérée', () => {
    const scan = new DateScanConsensus();
    expect(scan.observe(['2027-01-05'], 50)).toBeNull();
    expect(scan.observe(['2027-01-05'], 50)).toBeNull();
    expect(scan.observe(['2027-01-05'], 50)).toBe('2027-01-05');
  });
  it('oublie une ancienne proposition plutôt que de réutiliser une date obsolète', () => {
    const scan = new DateScanConsensus();
    scan.observe(['2027-01-05'], 90, 0);
    scan.observe([], 0, 11000);
    expect(scan.candidate).toBeNull();
    expect(scan.observe(['2027-01-05'], 90, 11100)).toBeNull();
  });
  it('ne confirme pas une date lorsque deux propositions restent à égalité', () => {
    const scan = new DateScanConsensus();
    scan.observe(['2027-01-05'], 90); scan.observe(['2027-01-06'], 90);
    scan.observe(['2027-01-05'], 90);
    expect(scan.observe(['2027-01-06'], 90)).toBeNull();
    expect(scan.candidate).toBeNull();
  });
  it('analyse la zone affichée malgré le recadrage de la caméra', () => {
    const region = dateFrameRegion(1920, 1080, 360, 270, { left: 8, top: 38, width: 84, height: 24 });
    expect(region.left).toBeCloseTo(18.5);
    expect(region.top).toBeCloseTo(38);
    expect(region.width).toBeCloseTo(63);
    expect(region.height).toBeCloseTo(24);
  });
});
