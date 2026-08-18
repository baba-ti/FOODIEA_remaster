const recipeImages = {
  bulgogi: require('../../assets/Image/bulgogi.jpg'),
  squid: require('../../assets/Image/friedSquid.jpg'),
  potatoEgg: require('../../assets/Image/cowbulgogi.jpg'),
  tofuKimchi: require('../../assets/Image/bulgogi.jpg'),
  tomatoEgg: require('../../assets/Image/friedSquid.jpg'),
  friedRice: require('../../assets/Image/cowbulgogi.jpg'),
};

export function getRecipeImage(imageKey) {
  return recipeImages[imageKey] ?? recipeImages.bulgogi;
}
