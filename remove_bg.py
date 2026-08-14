from PIL import Image
import sys

def remove_white_bg(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    data = img.getdata()
    
    new_data = []
    # threshold for "white/gray" background
    for item in data:
        # Check if the pixel is near white (R, G, B > 235)
        # The background in the screenshot looks like very light gray/white
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            # Check if it's not part of the dark blue robot parts
            new_data.append((255, 255, 255, 0)) # fully transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_white_bg(sys.argv[1], sys.argv[2])
