
import os

file_path = r'c:\Users\pav44\.gemini\antigravity\scratch\video-editing-site\public\editor.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep up to line 428 (index 428 in slicing because it's exclusive, so 0-427)
# Line 428 is <label class="prop-label">Pitch</label>
# So we want lines[:428]
part1 = lines[:428]

# Missing content and closing divs
middle_content = """                            <input type="range" id="pitchSlider" class="prop-range" min="-12" max="12" value="0">
                        </div>

                        <button id="applyVoiceEffects" class="btn btn-primary"
                            style="width: 100%; font-size: 0.875rem; padding: 0.5rem;">Apply Effect</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
"""

# Find the start of the modals. In the viewed file it was line 628.
# Let's search for it to be safe.
start_index = -1
for i, line in enumerate(lines):
    if 'id="loginModal"' in line:
        start_index = i
        break

if start_index == -1:
    print("Could not find loginModal")
    exit(1)

part3 = lines[start_index:]

new_content = "".join(part1) + middle_content + "".join(part3)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Fixed file. Kept {len(part1)} lines, added middle, appended from line {start_index+1}")
