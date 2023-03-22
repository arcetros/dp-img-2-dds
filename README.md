# dp-img-2-dds

![Alt text](https://raw.github.com/arcetros/dp-img-2-dds/main/cli_screenshot.jpg)

> Source code for [dp-img-2-dds](https://github.com/arcetros/dp-img-2-dds).

## Get Started

To run this application you need Node.js >=16.6.0 installed on your computer.

```bash
# install dependencies
npm install

# run development version
npm run dev

# build the application
npm run build

# run built application
npm run start
```

### How to replace in-game stickers?
> If you want to convert normal image formats to .dds make sure to put your images inside `images` folder and `images_output` are self explanatory (I recomend not to put files inside)
1. Prepare the materials located on your documents -> dp-img-2-dds folder. Make sure the resolution of your images are equal as the targetted sticker (width & height)
2. Make sure your game on the Drift Paradise login page
3. Run the application by `npm run start` and select `Replace original sticker with new ones`
4. Replace the stickers
5. Find the sticker you replaced (You've to find on pattern category)

## Todos

-   [ ] Compile to executable (unable to do this because storage running low)
-   [ ] ... more to come

## License

Distributed under the MIT License. See `LICENSE` for more information.
