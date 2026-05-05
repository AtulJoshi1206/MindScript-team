#!/usr/bin/env python3
import re

with open('server.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the old build_local_fallback_reply function
old_pattern = r'def build_local_fallback_reply\(user_text: str, history: list\[ChatMessage\]\) -> str:.*?(?=\n@lru_cache)'

new_func = '''def build_local_fallback_reply(user_text: str, history: list[ChatMessage]) -> str:
    lower = preprocess_text(user_text)
    language = detect_language(user_text)
    
    # Detect severity - self-harm, suicide
    severity_en = re.search(r"\\b(hurt|harm|kill|suicide|die|death|end it|cut|blade|rope|overdose|disappear)\\b", lower)
    severity_hi = re.search(r"(चोट|नुकसान|मौत|मर|आत्महत्या|खुद को|ख़त्म|बस|ठीक नहीं)", user_text)
    is_severe = severity_en or severity_hi
    
    options = []
    
    if is_severe:
        if language == "hi" and uses_devanagari(user_text):
            options = [
                "मेरी चिंता है तुम्हारे बारे में। क्या तुम किसी विश्वसनीय व्यक्ति को बता सकते हो? कृपया आत्महत्या निवारण हेल्पलाइन को कॉल करो - 1071।",
                "तुम महत्वपूर्ण हो। यह भावना गुजर जाएगी, लेकिन अभी तुम्हें मदद चाहिए। क्या तुम किसी डॉक्टर से बात कर सकते हो?",
            ]
        elif language == "hi":
            options = [
                "Meri chinta hai tumhare baare mein. Kya tum ksi vishwasaneeya vyakti ko bata sakte ho? Aatmahatya Navaaran Helpline: 1071",
                "Tum important ho. Yeh feeling theek ho jayega, lekin abhi tumhe madad chahiye. Doctor se baat kar sakte ho?",
            ]
        else:
            options = [
                "I'm really concerned about you. Please reach out to someone you trust or call National Suicide Prevention Lifeline: 988 (US).",
                "You matter so much. This feeling will pass, but you need support right now. Please talk to a mental health professional.",
            ]
    elif language == "hi" and re.search(r"\\b(khush|achha|accha|theek|better|good|job|proud|garv)\\b", lower):
        options = [
            "Yeh sunke bahut khushi hui. Is achhaye ko kaise zyada dinon tak rakh sakte ho?",
            "Bahut achi baat hai. Aisa kya hua jisse ye positive badlav aaya?",
            "Tumhe garv hona chahiye. Tumhare hisaab se sabse important kya tha?",
            "Behatreen. Isko aur bhi gahari nazar se dekh sakte ho?",
        ]
    elif language == "hi" and re.search(r"\\b(dukhi|pareshan|tension|stress|stressed|akela|dar|darr|thak|depress|udaas|ghabra)\\b", lower):
        options = [
            "Yeh kaafi heavy lag raha hai. Tum akele nahi ho. Sabse bada dard kaun sa hai?",
            "Samajh rahi hoon. Yeh feeling kab se? Kisi specific event ke baad shuru hua?",
            "Mujhe batao, sabse strong emotion kaun sa hai? Dard, dar, ya stress?",
            "Theek hai, dheere dheere samjhte hain. Sabse zyada dukh dene wali baat kya hai?",
        ]
    elif language == "hi" and uses_devanagari(user_text):
        if re.search(r"(खुश|अच्छा|बेहतर|गर्व|कामयाब|सुकून)", user_text):
            options = [
                "यह सुनकर बहुत खुशी हुई। इस अच्छाई को कैसे ज़्यादा दिनों तक बनाए रख सकते हो?",
                "बहुत अच्छी बात है। ऐसा क्या हुआ जिससे ये सकारात्मक परिवर्तन आया?",
                "तुम्हें गर्व होना चाहिए। तुम्हारे हिसाब से इसमें सबसे ज़रूरी चीज़ क्या थी?",
            ]
        elif re.search(r"(दुख|परेशान|तनाव|डर|अकेला|उदास|थक|घबर|निराश|दर्द)", user_text):
            options = [
                "यह काफ़ी भारी लग रहा है। तुम अभी अकेले नहीं हो। सबसे तकलीफ़ देह बात कौन सी है?",
                "समझ रही हूँ। यह भावना कब से तुम्हारे साथ है? क्या किसी ख़ास घटना के बाद शुरू हुआ?",
                "मुझे बताओ, इस समय तुम्हारे अंदर कौन सी भावना सबसे ज़्यादा मजबूत है? दर्द, डर, या कुछ और?",
                "ठीक है, हम इसे धीरे-धीरे समझते हैं। क्या तुम एक छोटी सी बात साझा कर सकते हो जो सबसे ज़्यादा दुख दे रही है?",
            ]
        else:
            options = [
                "मैं समझ रही हूँ। तुम्हारे लिए इस बात का सबसे ज़्यादा मायने क्या है?",
                "ठीक है, मैं सुन रही हूँ। बताओ, तुम्हारे अंदर अभी कौन सी भावना चल रही है?",
                "मुझे थोड़ा और जानने दो। यह कब से चल रहा है और इसका तुम पर क्या असर हो रहा है?",
                "हाँ, मैं यहाँ हूँ। इस समय तुम्हें क्या सबसे ज़्यादा परेशान कर रहा है?",
            ]
    elif language == "hi":
        options = [
            "Samajh rahi hoon. Is baat ka tumhare liye sabse zyada matlab kya hai?",
            "Theek hai, mein sun rahi hoon. Batao, tumhare andar kaun si bhavna chal rahi hai?",
            "Mujhe thoda or janne do. Yeh kab se chal raha hai aur iska tumpar kya asar pad raha hai?",
            "Haan, main yahan hoon. Abhi tumhe kya sabse zyada pareshan kar raha hai?",
        ]
    elif re.search(r"\\b(happy|good|great|better|job|proud|improve|strength|strong|well)\\b", lower):
        options = [
            "That's wonderful. What helped you feel this way today?",
            "I'm so glad you're noticing this positive change. How can you hold onto this feeling?",
            "That sounds like real progress. What part of it are you most proud of?",
            "That's beautiful. What would help you feel this way more often?",
        ]
    elif re.search(r"\\b(sad|down|tired|anxious|panic|alone|empty|stress|stressed|depress|upset|helpless|hopeless|miserable|overwhelmed|broken)\\b", lower):
        options = [
            "That sounds really hard. You're not alone in this. What hurts the most right now?",
            "I hear the pain in what you're sharing. When did this start feeling so heavy?",
            "Take a breath. What's the one thing that feels most overwhelming for you?",
            "I'm listening and I care. Can you tell me the hardest part of what you're carrying?",
            "It sounds like you're dealing with a lot. What emotion is strongest right now?",
        ]
    else:
        options = [
            "I'm here and listening. What matters most to you about what you just shared?",
            "Tell me more. How is that affecting you?",
            "I'm listening. When did this feeling start?",
            "What's the core of what you're experiencing right now?",
            "Help me understand. What's the biggest challenge for you in this situation?",
        ]

    recent = {item.text.strip().lower() for item in history[-10:] if item.role.lower() == "model"}
    seed = int(hashlib.sha256((user_text + str(len(history))).encode("utf-8")).hexdigest(), 16)
    ordered = options[seed % len(options):] + options[:seed % len(options)]
    return next((option for option in ordered if option.lower() not in recent), ordered[0])
'''

content_new = re.sub(old_pattern, new_func, content, flags=re.DOTALL)

if content_new != content:
    with open('server.py', 'w', encoding='utf-8') as f:
        f.write(content_new)
    print("✅ Updated successfully")
else:
    print("❌ No changes made - pattern not found")
