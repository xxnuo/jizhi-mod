import { useState, useEffect, useRef } from "react";
import { AiOutlinePlus as PlusIcon } from "react-icons/ai";

export default function LinkGroup() {
	const [links, setLinks] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newLink, setNewLink] = useState({ url: "", title: "" });
	const [error, setError] = useState("");
	// 添加 ref 用于输入框自动聚焦
	const urlInputRef = useRef(null);

	// 从本地存储加载链接
	useEffect(() => {
		const savedLinks = localStorage.getItem("linkGroup");
		if (savedLinks) {
			setLinks(JSON.parse(savedLinks));
		}
	}, []);

	// 保存链接到本地存储
	useEffect(() => {
		localStorage.setItem("linkGroup", JSON.stringify(links));
	}, [links]);

	// 添加：当模态框打开时，自动聚焦到 URL 输入框
	useEffect(() => {
		if (isModalOpen && urlInputRef.current) {
			urlInputRef.current.focus();
		}
	}, [isModalOpen]);

	// 生成首字母SVG
	const generateLetterAvatar = (title) => {
		const letter = title.substring(0, 1).toUpperCase();
		// 选择适合当前主题的颜色（使用CSS变量）
		const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#f4b43a" rx="12" ry="12" />
        <text x="50" y="50" dy="0.35em" 
              fill="currentColor" 
              font-family="Arial, sans-serif" 
              font-size="50" 
              text-anchor="middle"
              dominant-baseline="middle">${letter}</text>
      </svg>
    `;
		return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
	};

	// 获取网站favicon的函数
	const getFavicon = (domain) => {
		return `https://${domain}/favicon.ico`;
	};

	// 添加新链接
	const handleAddLink = () => {
		// 验证URL
		if (!newLink.url) {
			setError("请输入链接地址");
			return;
		}

		try {
			// 确保URL格式正确
			let formattedUrl = newLink.url;
			if (!/^https?:\/\//i.test(formattedUrl)) {
				formattedUrl = `https://${formattedUrl}`;
			}

			const url = new URL(formattedUrl);
			const domain = url.hostname;
			
			// 添加更严格的域名验证
			if (!domain.includes('.') || domain.split('.').some(part => part.length === 0)) {
				setError("请输入有效的域名（如example.com）");
				return;
			}

			// 如果标题为空，则从域名中提取
			let title = newLink.title;
			if (!title) {
				// 移除www.前缀并拆分域名，取第一部分
				title = domain.replace(/^www\./, "").split(".")[0];
				// 首字母大写
				title = title.charAt(0).toUpperCase() + title.slice(1);
			}

			const linkToAdd = {
				id: Date.now(),
				url: formattedUrl,
				title: title,
				favicon: getFavicon(domain), // 使用favicon获取函数
			};

			setLinks([...links, linkToAdd]);
			setNewLink({ url: "", title: "" });
			setIsModalOpen(false);
			setError("");
		} catch (e) {
			setError("请输入有效的链接地址");
		}
	};

	// 删除链接
	const handleDeleteLink = (id) => {
		setLinks(links.filter((link) => link.id !== id));
	};

	// 键盘事件处理
	const handleKeyDown = (event, callback) => {
		if (event.key === "Enter" || event.key === " ") {
			callback();
		}
	};

	return (
		<div className="w-full max-w-4xl px-4">
			{/* 链接组显示 */}
			<div className="flex flex-wrap justify-center gap-8 mt-4">
				{links.map((link) => (
					<button
						key={link.id}
						className="flex flex-col items-center justify-center rounded-lg cursor-alias transition-all duration-300 hover:scale-110 gap-2 group"
						onClick={() => window.open(link.url, "_blank")}
						onKeyDown={(e) =>
							handleKeyDown(e, () => window.open(link.url, "_blank"))
						}
						aria-label={`打开 ${link.title}`}
						type="button"
					>
						<img
							src={link.favicon}
							alt=""
							className="w-12 h-12 object-contain"
							onError={(e) => {
								// 如果备选源也失败，使用SVG字母头像
								e.target.onerror = null; // 防止无限循环
								e.target.src = generateLetterAvatar(link.title);
							}}
						/>
						<span className="text-sm text-center max-w-[48px] truncate">{link.title}</span>
						<div
							className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-error text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs cursor-pointer"
							onClick={(e) => {
								e.stopPropagation();
								handleDeleteLink(link.id);
							}}
							onKeyDown={(e) =>
								handleKeyDown(e, () => handleDeleteLink(link.id))
							}
							aria-label="删除链接"
						>
							×
						</div>
					</button>
				))}

				{/* 添加链接按钮 */}
				<button
					className="flex flex-col items-center justify-center rounded-lg cursor-pointer transition-all duration-300 hover:scale-110 hover:opacity-100 opacity-50 gap-2"
					onClick={() => setIsModalOpen(true)}
					onKeyDown={(e) => handleKeyDown(e, () => setIsModalOpen(true))}
					aria-label="添加新链接"
					type="button"
				>
					<PlusIcon className="w-12 h-12" />
					<span className="text-sm text-center">添加</span>
				</button>
			</div>

			{/* 添加链接弹窗 */}
			{isModalOpen && (
				<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
					<div className="bg-base-100 p-6 rounded-lg w-96 shadow-lg">
						<h3 className="text-lg font-medium mb-4">添加新链接</h3>

						<div className="mb-4">
							<label
								htmlFor="linkUrl"
								className="block text-sm font-medium mb-1"
							>
								链接地址 *
							</label>
							<input
								id="linkUrl"
								type="text"
								ref={urlInputRef}
								value={newLink.url}
								onChange={(e) =>
									setNewLink({ ...newLink, url: e.target.value })
								}
								placeholder="https://example.com"
								className="w-full p-2 border rounded-md bg-base-200 border-base-300"
							/>
						</div>

						<div className="mb-4">
							<label
								htmlFor="linkTitle"
								className="block text-sm font-medium mb-1"
							>
								标题 (可选)
							</label>
							<input
								id="linkTitle"
								type="text"
								value={newLink.title}
								onChange={(e) =>
									setNewLink({ ...newLink, title: e.target.value })
								}
								placeholder="不填写则使用域名"
								className="w-full p-2 border rounded-md bg-base-200 border-base-300"
							/>
						</div>

						{error && <p className="text-error text-sm mb-4">{error}</p>}

						<div className="flex justify-end gap-2">
							<button
								type="button"
								onClick={() => {
									setIsModalOpen(false);
									setNewLink({ url: "", title: "" });
									setError("");
								}}
								className="px-4 py-2 text-sm border rounded-md hover:bg-base-200"
							>
								取消
							</button>
							<button
								type="button"
								onClick={handleAddLink}
								className="px-4 py-2 text-sm bg-primary text-primary-content rounded-md hover:bg-primary-focus"
							>
								添加
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
