from PIL import Image, ImageDraw
import sys

def remove_bg(input_path, output_path):
    img = Image.open(input_path).convert('RGBA')
    # Use floodfill to replace the background (starting from top-left) with a magic color (magenta)
    ImageDraw.floodfill(img, (0, 0), (255, 0, 255, 255), thresh=40)
    
    # Also floodfill from top-right just in case
    width, height = img.size
    ImageDraw.floodfill(img, (width-1, 0), (255, 0, 255, 255), thresh=40)
    
    # Replace the magic color with transparent
    datas = img.getdata()
    new_data = []
    for item in datas:
        if item[0] == 255 and item[1] == 0 and item[2] == 255 and item[3] == 255:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")

remove_bg(sys.argv[1], sys.argv[2])
