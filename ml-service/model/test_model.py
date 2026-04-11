"""
NyayaSetu ML Model - Test Script

This script tests the complete NyayaSetu ML pipeline on example complaints.
No external dependencies beyond what's in the model code.

Usage:
  python test_model.py
"""

import sys
import json
from pathlib import Path

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add the nyayasetu_ml module to path
sys.path.insert(0, str(Path(__file__).parent))

from nyayasetu_ml.inference.run import NyayaSetuInference
from nyayasetu_ml.data.bns_sections import BNS_SECTIONS


def print_section(title):
    """Print a formatted section header."""
    sep = "=" * 70
    print(f"\n{sep}")
    print(f"  {title}")
    print(sep)


def test_example(text, example_num=1):
    """Test a single complaint text through the pipeline."""
    print(f"\n{'─' * 70}")
    print(f"  EXAMPLE {example_num}: {text[:60]}...")
    print(f"{'─' * 70}\n")
    
    try:
        # Initialize the inference engine (uses trained IndicBERT if available)
        engine = NyayaSetuInference()
        
        # Run inference on the text
        result = engine.from_text(text)
        
        # Print summary
        result.print_summary()
        
        # Also output as JSON
        print("\n  JSON Output:")
        print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))
        
        return result
        
    except Exception as e:
        print(f"❌ Error processing example: {e}")
        import traceback
        traceback.print_exc()
        return None


def main():
    """Run test examples."""
    print_section("NyayaSetu ML Model — Test Suite (IndicBERT Backend)")
    
    # Test examples from training data
    test_cases = [
        # House theft
        "Mere ghar mein kal raat koi ghus aaya. Main so raha tha tab darwaza tod ke andar aaya aur mera laptop, 15 hazaar cash aur biwi ke gold ke kangan le gaya. Subah uthke dekha to sab khatam. CCTV mein ek banda dikh raha hai kala jacket mein.",
        
        # Online fraud
        "Mujhe ek call aaya ki mera bank account band hone wala hai. Unhone OTP maanga aur mere account se 45000 rupaye nikal liye. Ye online fraud hai.",
        
        # Robbery / Snatching
        "Main ATM se paisa nikal ke aa raha tha. Do ladke bike par aaye, chaku dikhaya aur mere haath se purse cheen ke bhaag gaye. Purse mein 20000 cash tha.",
        
        # Assault / Hurt
        "Mere padosi ne mujhse jhagda kiya aur mujhe ghoos maara. Meri naak se khoon aa raha tha. Witnesses hain.",
        
        # Cheating / Investment fraud
        "Investment scheme mein paisa lagaya tha 2 lakh. Company ne paisa wapas nahi diya. Promoter ka phone bhi band hai ab.",
        
        # English example
        "Someone called me pretending to be from SBI bank and asked for my debit card number and OTP. After I gave it, Rs 78000 was debited from my account.",
    ]
    
    results = []
    for i, text in enumerate(test_cases, 1):
        result = test_example(text, i)
        if result:
            results.append(result.to_dict())
    
    # Summary statistics
    print_section("Test Summary")
    print(f"\n  Total examples tested: {len(test_cases)}")
    print(f"  Successful predictions: {len(results)}")
    
    if results:
        sections_found = set()
        for r in results:
            sections_found.update(r['bns_sections'])
        
        print(f"  Unique BNS sections predicted: {len(sections_found)}")
        print(f"  Sections: {', '.join(sorted(sections_found))}")
        
        cognizable_count = sum(1 for r in results if r['cognizable'])
        print(f"\n  Cognizable crimes: {cognizable_count}/{len(results)}")
        print(f"  Non-cognizable crimes: {len(results) - cognizable_count}/{len(results)}")
    
    print("\n" + "=" * 70)
    print("  ✓ Test complete!")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    main()
