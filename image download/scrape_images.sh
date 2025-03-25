# #!/bin/bash

# # Base URL
# BASE_URL="https://techmi-mg.com/products/category"
# IMAGE_BASE_URL="https://techmi-mg.com/upload/images/products/"
# OUTPUT_FOLDER="materials"
# MAX_PAGES=10   # Adjust as needed
# MAX_CATEGORIES=3   # Adjust as needed

# # Function to fetch images from a page
# fetch_images_from_page() {
#     local category=$1
#     local page=$2
#     local url="${BASE_URL}/${category}"
#     if [[ $page -gt 1 ]]; then
#         url="${url}?page=${page}"
#     fi

#     echo "Fetching images from: $url"

#     # Fetch the HTML content
#     html=$(curl -s "$url")

#     # Create a category-specific folder dynamically
#     CATEGORY_FOLDER="$OUTPUT_FOLDER/$category"
#     mkdir -p "$CATEGORY_FOLDER"

#     # Extract image URLs that match IMAGE_BASE_URL
#     echo "$html" | grep -oE '<img[^>]+src="([^"]+)"' | sed -E 's/.*src="([^"]+)".*/\1/' | grep "^$IMAGE_BASE_URL" | while read -r img_url; do
#         # Get the filename from the URL
#         filename=$(basename "$img_url")
#         file_path="$CATEGORY_FOLDER/$filename"

#         # Check if the file already exists before downloading
#         if [[ -f "$file_path" ]]; then
#             echo "Skipping (already exists): $file_path"
#             continue
#         fi

       

#         # Check if the file has the "small_" prefix and try to download the full-size version
#         if [[ "$filename" == small_* ]]; then
#             new_filename="${filename#small_}"  # Remove "small_" prefix
#             new_img_url="${IMAGE_BASE_URL}${new_filename}"
#             new_file_path="$CATEGORY_FOLDER/$new_filename"

#              echo "Downloading: $new_img_url"
#             curl -s -o "$new_file_path" "$new_img_url"
#         fi
#     done
# }

# # Iterate through categories and pages
# for category in $(seq 1 $MAX_CATEGORIES); do
#     for page in $(seq 1 $MAX_PAGES); do
#         fetch_images_from_page "$category" "$page"
#     done
# done

# echo "Download complete! Images saved in '$OUTPUT_FOLDER'"



# JSON CREATION 


#!/bin/bash

BASE_DIR="./materials"
declare -A CATEGORY_MAP
CATEGORY_MAP[1]="Marble"
CATEGORY_MAP[2]="Granite"
CATEGORY_MAP[3]="Onyx"

FIREBASE_BASE_URL="https://firebasestorage.googleapis.com/v0/b/yotto-stones.firebasestorage.app/o/images%2Fgroup_materials"

# Start JSON manually
json_output='{ "group_materials": ['

for id in 1 2 3; do
    category="${CATEGORY_MAP[$id]}"
    folder="$BASE_DIR/$id"

    if [[ ! -d "$folder" ]]; then
        continue
    fi

    json_output+=' {'
    json_output+="\"id\": $id,"
    json_output+="\"category\": \"$category\","
    json_output+="\"materials\": ["

    material_id=1
    for file in "$folder"/*; do
        if [[ -f "$file" ]]; then
            filename=$(basename "$file")
            name="${filename%.*}"
            imageUrl="$FIREBASE_BASE_URL%2F$category%2F$filename?alt=media&token=16e56091-a47b-466a-a0a2-5f03c3eb06c1"

            json_output+=' {'
            json_output+="\"id\": $material_id,"
            json_output+="\"name\": \"$name\","
            json_output+="\"imageUrl\": \"$imageUrl\""
            json_output+=' },'

            ((material_id++))
        fi
    done

    json_output=${json_output%,}  
    json_output+="] },"
done

json_output=${json_output%,}  
json_output+="] }"

# Save JSON to file
echo "$json_output" > materials.json

echo "JSON file generated: materials.json"
