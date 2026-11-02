import { BarcodeFormat } from '@zxing/library';
import { BarcodeConsensus, retailBarcode } from './barcode-validation';

describe('Validation des codes de produits', () => {
  it('vérifie aussi la clé des codes EAN-8', () => {
    expect(retailBarcode('96385074', BarcodeFormat.EAN_8)).toBe('96385074');
    expect(retailBarcode('96385075', BarcodeFormat.EAN_8)).toBeNull();
    expect(retailBarcode('3017620422003', BarcodeFormat.EAN_13)).toBe('3017620422003');
    expect(retailBarcode('3017620422004', BarcodeFormat.EAN_13)).toBeNull();
    expect(retailBarcode('123456789', BarcodeFormat.CODE_128)).toBeNull();
  });
  it('décompresse un UPC-E avant de vérifier sa clé et rechercher le produit', () => {
    expect(retailBarcode('04252614', BarcodeFormat.UPC_E)).toBe('042100005264');
    expect(retailBarcode('04252615', BarcodeFormat.UPC_E)).toBeNull();
  });
  it('attend trois images concordantes malgré une lecture parasite', () => {
    const consensus = new BarcodeConsensus();
    expect(consensus.observe('wrong', 100)).toBeFalse();
    expect(consensus.observe('correct', 200)).toBeFalse();
    expect(consensus.observe(null, 300)).toBeFalse();
    expect(consensus.observe('correct', 400)).toBeFalse();
    expect(consensus.observe('correct', 500)).toBeTrue();
  });
  it('conserve les bonnes lectures entre des images floues dues aux tremblements', () => {
    const consensus = new BarcodeConsensus();
    expect(consensus.observe('correct', 100)).toBeFalse();
    expect(consensus.observe(null, 900)).toBeFalse();
    expect(consensus.observe('correct', 2200)).toBeFalse();
    expect(consensus.observe('parasite', 2400)).toBeFalse();
    expect(consensus.observe(null, 3700)).toBeFalse();
    expect(consensus.observe('correct', 4800)).toBeTrue();
  });
  it('refuse des codes concurrents sans majorité suffisante', () => {
    const consensus = new BarcodeConsensus();
    for (const [index, code] of ['a', 'b', 'a', 'b', 'a', 'b'].entries()) {
      expect(consensus.observe(code, index * 300)).toBeFalse();
    }
  });
  it('ne cumule pas des observations anciennes', () => {
    const consensus = new BarcodeConsensus();
    consensus.observe('code', 100); consensus.observe('code', 200);
    expect(consensus.observe('code', 7000)).toBeFalse();
  });
});
