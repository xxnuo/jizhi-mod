// 使用示例

// import Wallhaven from "@/components/Wallhaven";
// const wallhaven = new Wallhaven();
// const [wallpaperJson, setWallpaperJson] = useState<{ data: { path: string }[] } | null>(null);
// useEffect(() => {
//   if (!wallpaperJson) {
//     wallhaven.randomizeAnime().then((json) => {
//       setWallpaperJson(json);
//     });
//   }
//   // 设置页面壁纸
//   // 使用类型断言告知编译器“wallpaperJson”对象的结构
//   const wallpaperData = wallpaperJson as { data: { path: string }[] };

//   // 然后可以安全地访问属性
//   if (wallpaperData && wallpaperData.data && wallpaperData.data.length > 0) {
//     const wallpaper = wallpaperData.data[0].path;
//     const root = document.getElementById("root") as HTMLDivElement;
//     root.style.backgroundImage = `url(${wallpaper})`;
//     root.style.backgroundSize = "cover";
//     root.style.backgroundRepeat = "no-repeat";
//     root.style.backgroundPosition = "center";
//     // 模糊背景
//     root.style.filter = "blur(10px)";
//   }
// }, [wallpaperJson]);

export default class Wallhaven {
  private token: string;

  constructor() {
    this.token = "fKffdL7hmqINytWRr7vf3HQMLU5QjSbY";
  }

  private async fetchWallpapers(purity: string) {
    try {
      const response = await fetch(
        `https://wallhaven.cc/api/v1/search?apikey=${this.token}&categories=100&purity=${purity}&sorting=random`
      );
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async randomizeAnime(options: { nsfw?: boolean; onlyNSFW?: boolean } = {}) {
    const { nsfw = false, onlyNSFW = false } = options;
    let purity: string;

    if (nsfw) {
      purity = "101";
    } else if (onlyNSFW) {
      purity = "001";
    } else {
      purity = "100";
    }

    return await this.fetchWallpapers(purity);
  }

  async login(token: string) {
    try {
      const response = await fetch(`https://wallhaven.cc/api/v1/settings?apikey=${token}`);
      if (response.status === 200) {
        this.token = token;
        console.log(await response.json());
        console.log("[ TOKEN ] (Successful loggin to Wallhaven.cc)");
      } else {
        console.log(
          "[ TOKEN ] (Invalid token, if you do not have it generated enter to:) \nhttps://wallhaven.cc/settings/account"
        );
      }
    } catch (error) {
      console.error(error);
    }
  }
}
