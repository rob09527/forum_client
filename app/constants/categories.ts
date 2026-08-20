import type { Category, SortOption } from '~/types'

/** 主分类列表（静态兜底，运行时优先从 API 获取） */
export const mainCategories: Category[] = [
  { slug: 'general', name: '综合讨论', icon: '📂', postCount: '12.3k' },
  { slug: 'llm', name: '大模型', icon: '🤖', postCount: '8.9k' },
  { slug: 'agent', name: 'AI Agent', icon: '🔧', postCount: '5.6k' },
  { slug: 'prompt', name: 'Prompt 工程', icon: '✍️', postCount: '4.2k' },
  { slug: 'art', name: 'AI 绘画', icon: '🎨', postCount: '7.1k' },
  { slug: 'opensource', name: '开源模型', icon: '📦', postCount: '6.4k' },
  { slug: 'tools', name: 'AI 工具', icon: '🛠', postCount: '9.8k' },
  { slug: 'paper', name: '论文解读', icon: '📄', postCount: '3.1k' },
  { slug: 'share', name: '经验分享', icon: '💡', postCount: '5.5k' },
]

/**
 * 热门标签列表（静态兜底，运行时优先从 API 获取）。
 * 与后端 server/src/services/category/category.service.ts 保持同步。
 */
export const subTags: string[] = [
  // ── 大语言模型 (LLMs) ──
  'GPT-5', 'GPT-4o', 'GPT-4', 'GPT-4-Turbo', 'GPT-3.5',
  'o4', 'o4-mini',
  'Claude', 'Claude Opus', 'Claude Sonnet', 'Claude Haiku',
  'Gemini', 'Gemini 2.5', 'Gemini 2.0', 'Gemma',
  'DeepSeek', 'DeepSeek V4', 'DeepSeek R2', 'DeepSeek Coder',
  'Qwen', 'Qwen 3', 'Qwen 2.5', 'QwQ',
  'Llama', 'Llama 4', 'Llama 3', 'Code Llama',
  'Mistral', 'Mixtral', 'Mistral Large',
  'Grok', 'Grok 4',
  'Yi', 'Yi-Lightning', 'Yi-Vision',
  'Command R+', 'Cohere',
  'Phi', 'Phi-4', 'Phi-3',
  'Falcon', 'MPT', 'DBRX',
  'Jamba', 'Granite', 'OLMo', 'DCLM',
  'BLOOM', 'Baichuan', 'ChatGLM', 'InternLM',
  'MiniCPM', 'Skywork', 'TeleChat',
  'Reka', 'Aya', 'SOLAR',
  'Nemotron', 'Arctic',

  // ── 推理模型 ──
  '推理模型', 'Chain-of-Thought', 'Tree-of-Thought', 'Self-Consistency',
  'ReAct', 'Auto-CoT', 'Reflexion', 'Self-Refine',

  // ── 图像模型 ──
  'Stable Diffusion', 'SDXL', 'SD3.5', 'SD3', 'Stable Cascade',
  'Flux', 'Flux Pro', 'Flux Dev', 'Flux Schnell',
  'Midjourney', 'Midjourney V7', 'Midjourney V6',
  'DALL-E', 'DALL-E 4',
  'AuraFlow', 'Playground', 'PixArt',
  'Kolors', 'Hunyuan-DiT',
  'Ideogram', 'Imagen',

  // ── 视频模型 ──
  'Sora', 'Sora Turbo',
  'Runway', 'Runway Gen-4', 'Runway Gen-3',
  'Kling', 'Kling 2.0',
  'Pika', 'Pika 2.0',
  'Luma Dream Machine', 'Luma Ray2',
  'Hailuo', 'Vidu',
  'PixVerse', 'Mochi',
  'Stable Video Diffusion',
  'CogVideoX', 'AnimateDiff', 'Hotshot',
  'Emu Video', 'VideoPoet',

  // ── 3D 模型 ──
  '3D生成', 'NeRF', 'Gaussian Splatting', 'TripoSR',
  'Meshy', 'Luma Genie', 'Shap-E',

  // ── 音频/语音模型 ──
  'Whisper', 'Whisper Large', 'WhisperX', 'faster-whisper',
  'ElevenLabs', 'Suno', 'Suno V5', 'Udio',
  'Bark', 'XTTS', 'StyleTTS',
  'MusicGen', 'AudioGen',
  'CosyVoice', 'ChatTTS', 'FishSpeech',
  'Parler-TTS', 'MeloTTS', 'OpenVoice',
  'Stable Audio', 'F5-TTS', 'Spark-TTS',

  // ── AI 编程 ──
  'Copilot', 'GitHub Copilot',
  'Cursor', 'Cursor Agent',
  'Cline', 'Aider', 'Devin',
  'Codeium', 'Windsurf', 'Supermaven',
  'Tabnine', 'Sourcegraph Cody',
  'Replit Agent', 'Bolt.new', 'Lovable',
  'v0.dev', 'Claude Code',
  'Continue.dev', 'OpenHands', 'SWE-Agent',
  'CodeGeeX', 'TONGYI Lingma',
  'Sweep', 'Plandex', 'Qodo',

  // ── AI 工具 / 平台 ──
  'Dify', 'Coze', '扣子',
  'Ollama', 'vLLM', 'SGLang', 'LM Studio', 'llama.cpp',
  'GPT4All', 'Jan',
  'ComfyUI', 'Automatic1111', 'InvokeAI', 'Fooocus',
  'HuggingFace', 'HuggingFace Spaces', 'Gradio', 'Streamlit', 'Chainlit',
  'Replicate', 'Together AI', 'Fireworks AI', 'Groq',
  'OpenRouter', 'DeepInfra', 'Baseten', 'Modal', 'RunPod',
  'Weights & Biases', 'MLflow', 'ClearML',
  'LangSmith', 'LangFuse', 'Arize',
  'ChromaDB', 'Qdrant', 'Pinecone',
  'Vercel AI SDK', 'Cloudflare AI',
  'Notion AI', 'Perplexity', 'Phind',

  // ── 低代码/无代码 AI ──
  'n8n', 'Flowise', 'LangFlow', 'Relevance AI',

  // ── 技术/方法 ──
  'RAG', 'Advanced RAG', 'Graph RAG', 'Agentic RAG', 'HyDE',
  'Fine-tuning', 'SFT', 'RLHF', 'DPO', 'PPO',
  'LoRA', 'QLoRA', 'DoRA',
  'Prompt Engineering', 'Few-shot', 'Zero-shot',
  'Mixture of Experts', 'MoE',
  'Transformer', 'Attention', 'FlashAttention',
  'Tokenization', 'Embedding', 'BGE', 'E5',
  'Vector Search', 'Semantic Search', 'Hybrid Search',
  'KV Cache', 'Speculative Decoding',
  'Distillation', 'Quantization', 'GGUF', 'GPTQ', 'AWQ',
  'Diffusion Models', 'Flow Matching',
  'GAN', 'VAE', 'CLIP',
  'Contrastive Learning', 'Self-Supervised Learning',
  'Transfer Learning', 'Federated Learning',
  'Synthetic Data', 'Data Augmentation',
  'Graph Neural Networks', 'GNN',
  'State Space Model', 'Mamba', 'Mamba-2',
  'Test-Time Compute', 'Inference-Time Scaling',
  'Mechanistic Interpretability',

  // ── 框架 / 库 ──
  'PyTorch', 'TensorFlow', 'JAX', 'Keras',
  'HuggingFace Transformers', 'Diffusers', 'Datasets', 'Accelerate', 'PEFT',
  'LangChain', 'LangGraph', 'LlamaIndex', 'Haystack', 'DSPy',
  'Semantic Kernel', 'AutoGen', 'CrewAI',
  'FastAPI', 'ONNX', 'ONNX Runtime', 'OpenVINO', 'TensorRT',
  'Ray', 'Triton Inference Server', 'BentoML',
  'DuckDB', 'ZenML', 'Prefect',
  'YOLO', 'YOLOv10', 'Transformers.js',

  // ── 向量数据库 ──
  'ChromaDB', 'Qdrant', 'Pinecone', 'Weaviate', 'Milvus',
  'pgvector', 'Elasticsearch', 'FAISS',

  // ── Agent 框架 ──
  'AI Agent', 'Multi-Agent', 'Agentic AI',
  'LangGraph', 'AutoGPT', 'BabyAGI', 'MetaGPT',
  'CrewAI', 'AutoGen', 'TaskWeaver',
  'MCP', 'A2A',

  // ── 公司 / 机构 ──
  'OpenAI', 'Anthropic', 'Google DeepMind', 'Google AI',
  'Meta AI', 'Mistral AI', 'Cohere', 'xAI', 'Stability AI',
  'Midjourney Inc', 'Runway ML', 'Pika Labs',
  'Black Forest Labs', 'Luma AI',
  'Hugging Face', 'Replicate', 'Together AI',
  'Scale AI', 'Perplexity AI', 'Anysphere',
  'Sakana AI', 'Liquid AI', 'Cartesia',
  'ElevenLabs', 'Suno Inc',

  // ── 国产 AI ──
  '百度文心', '文心一言', 'ERNIE',
  '阿里通义', '通义千问',
  '字节豆包', '豆包',
  '腾讯混元', '混元大模型',
  '讯飞星火', 'SparkDesk',
  '智谱', '智谱清言', 'ChatGLM',
  '月之暗面', 'Moonshot', 'Kimi',
  '百川智能', 'Baichuan',
  'MiniMax', '海螺AI', 'Hailuo AI',
  '零一万物', 'Yi',
  '深度求索', 'DeepSeek',
  '面壁智能', 'MiniCPM', 'OpenBMB',
  '昆仑万维', 'Skywork',
  '上海AI Lab', '书生', 'InternLM',
  '阶跃星辰', '生数科技', 'Vidu',

  // ── 论文/学术 ──
  'Attention Is All You Need', 'BERT', 'GPT论文', 'ViT', 'ResNet',
  'Scaling Laws', 'Chinchilla',
  'LLaMA论文', 'Mistral论文', 'Gemini技术报告',
  'DPO论文', 'RLHF论文',
  'LoRA论文', 'FlashAttention论文',
  'Mamba论文', 'RAG论文', 'GraphRAG',
  'Sora技术报告', 'DiT论文',

  // ── 数据集 ──
  'CommonCrawl', 'The Pile', 'RedPajama',
  'MMLU', 'HumanEval', 'SWE-bench', 'GSM8K', 'MATH',
  'Alpaca', 'ShareGPT',
  'Chatbot Arena', 'LMSYS',
  'LAION', 'COCO', 'ImageNet',
  'BigCode', 'The Stack',

  // ── 概念/术语 ──
  'AGI', 'ASI', 'Superintelligence',
  'Alignment', 'AI Safety', 'AI Ethics',
  'Hallucination', 'Factuality',
  'Context Window', '上下文长度', 'Long Context',
  'Scaling Law', 'Emergence',
  'Red Teaming', 'Jailbreak', 'Prompt Injection',
  'Tool Use', 'Function Calling', 'Code Interpreter',
  'Grounding', 'Reasoning', 'Planning',
  'Foundation Model', 'Frontier Model',
  'Small Language Model', 'SLM', 'On-device AI',
  'Green AI', 'AI 算力',

  // ── 应用领域 ──
  'Healthcare AI', 'Medical AI', 'Drug Discovery',
  'AlphaFold', 'AlphaFold 3',
  'Legal AI', 'Education AI', 'Finance AI',
  'Robotics', 'Embodied AI', 'Autonomous Driving',
  'Gaming AI', 'Science AI', 'AI for Science',
  'Math AI', 'Search AI', 'Translation AI',

  // ── Prompt 工程 ──
  '提示词', 'Prompt', 'System Prompt',
  'Chain of Thought', 'CoT',
  'Few-Shot', 'Zero-Shot',
  'ReAct', 'Tree of Thoughts',
  'Self-Consistency', 'Role Prompting',
  'DSPy', 'Prompt Tuning',

  // ── 多模态 ──
  '多模态', 'Multimodal',
  'Vision Language Model', 'VLM',
  'GPT-4V', 'Claude Vision', 'Gemini Vision',
  'LLaVA', 'CogVLM', 'Qwen-VL',
  'Text-to-Image', 'Text-to-Video',
  'Text-to-Speech', 'TTS', 'Speech-to-Text', 'STT',
  'Visual QA', 'Document AI', 'OCR',

  // ── 部署 / 运维 ──
  'Docker', 'Kubernetes', 'K8s',
  'AWS SageMaker', 'AWS Bedrock',
  'Google Vertex AI',
  'Azure OpenAI',
  'NVIDIA', 'CUDA', 'GPU',
  'H100', 'A100', 'B100', 'B200',
  'TPU', 'Model Serving', 'Inference Optimization',
  'MLOps', 'Model Monitoring',
  'A/B Testing', 'Cost Optimization',

  // ── AI 安全 ──
  'AI Safety', 'AI Security', 'AI Alignment',
  'Jailbreak', 'Prompt Injection',
  'Bias', 'Fairness',
  'Differential Privacy', 'Federated Learning Privacy',
  'EU AI Act', 'AI Regulation', 'AI Governance',
  'Responsible AI',

  // ── 开源项目 / 社区热点 ──
  'Stable Diffusion WebUI', 'ComfyUI',
  'LangChain', 'LlamaIndex', 'Dify',
  'Ollama', 'llama.cpp',
  'vLLM', 'SGLang', 'Unsloth', 'LLaMA-Factory',
  'Open WebUI', 'LibreChat', 'LobeChat', 'NextChat',
  'FastChat', 'AutoGPT', 'GPT-Engineer',
  'PrivateGPT', 'GPT4All', 'AnythingLLM',
  'Sentence Transformers', 'BGE',
  'OpenRLHF', 'TRL',

  // ── 热门话题 / 讨论方向 ──
  '模型评测', 'Benchmark',
  '本地部署', 'Local LLM', '离线AI',
  '性价比', '成本分析',
  '开源 vs 闭源', 'Open Source AI',
  'AGI 时间线', 'AI 未来',
  'AI 创业', 'AI 商业化',
  'AI 取代工作', 'AI 就业',
  'AI 教育', 'AI 学习路线', 'AI 入门',
  'AI 生产力', '效率提升', '工作流自动化',
  '数字人', 'AI 虚拟主播', 'AI 陪伴',
  'AI 写作', 'AI 编程', 'AI 翻译',
  'AI 硬件', 'AI PC', 'AI 手机', 'NPU',
  'AI 芯片', 'AI Chip',
  '长文本', 'Long Context',
  '多语言', 'Multilingual', '中文能力',
  '幻觉问题', '事实性', 'RAG幻觉',

  // ══════════════════════════════════════════════
  // 中文标签扩展（约 1000 个，与后端同步）
  // ══════════════════════════════════════════════

  // ── 国产大模型 ──
  '文心一言4.0', '文心大模型', 'ERNIE 4.5',
  '通义千问3.0', '通义千问Max', '通义千问Turbo',
  '豆包大模型', '豆包Pro', '火山方舟',
  '混元大模型', '混元Turbo', '混元Pro',
  '讯飞星火4.0', '星火认知大模型',
  '智谱GLM-4', 'GLM-4-Plus', 'GLM-4V', 'ChatGLM-6B',
  'Kimi Chat', 'Kimi 探索版', 'Moonshot v1',
  '百川4', 'Baichuan4', 'Baichuan3-Turbo',
  'MiniMax-Text', 'abab7', 'abab6.5',
  'Yi-Large', 'Yi-Vision',
  'DeepSeek V3', 'DeepSeek R1', 'DeepSeek Coder V2',
  '书生浦语', 'InternLM3', 'InternVL2',
  'MiniCPM-3', 'MiniCPM-V',
  '天工大模型', 'Skywork', '天工4.0',
  'Step-2', '阶跃星辰',
  '孟子大模型', '元象XVERSE',
  'DeepSeek-R1-Distill', 'Qwen2.5-Coder',

  // ── 国内AI公司/平台 ──
  '百度智能云', '千帆大模型平台', '百度飞桨', 'PaddlePaddle',
  '阿里云', '百炼平台', '阿里云百炼',
  '腾讯云', '腾讯元宝', '元宝',
  '字节跳动', '火山引擎', '扣子平台',
  '讯飞开放平台', '智谱开放平台',
  '商汤科技', '商汤日日新', 'SenseNova',
  '旷视科技', '科大讯飞', '硅基流动', 'SiliconFlow',
  '潞晨科技', '无问芯穹',
  '秘塔科技', '秘塔AI搜索',
  'Monica', 'Monica.im',
  'LiblibAI', '哩布哩布',
  '即梦AI', 'Dreamina',
  '海螺AI', '可灵AI',
  'PixVerse', 'Vidu', 'HiDream',
  '第四范式', '寒武纪MLU', '摩尔线程',

  // ── 中文技术概念 ──
  '大模型', '大语言模型', '基础模型',
  '预训练', '预训练模型', '持续预训练', '后训练',
  '有监督微调', '指令微调', '指令遵循', '对齐训练',
  '人类反馈强化学习', '偏好对齐', '价值对齐',
  '思维链', '思维树', '逻辑推理',
  '上下文学习', '少样本学习', '零样本学习',
  '提示词工程', '提示词优化',
  '模型幻觉', '事实性校验', '知识边界',
  '模型蒸馏', '知识蒸馏', '模型压缩',
  '量化部署', 'INT4量化', 'INT8量化',
  '参数高效微调', 'PEFT微调',
  '模型评估', '评测基准', '红队测试',
  '模型安全', '内容安全', '输出审核',
  '模型可解释性', '涌现能力', '规模定律',
  '混合专家模型', '稀疏MoE',
  '检索增强生成', '知识增强',
  '工具调用', '函数调用', '代码解释器',
  '规划能力', '推理能力', '数学推理',
  '多模态融合', '图文理解', '视觉语言对齐',
  '合成数据', '数据蒸馏', '数据配比',
  '词表扩展', '中文词表', '分词器',

  // ── AI 应用场景（中文） ──
  '智能客服', 'AI客服', '机器人客服',
  '智能办公', 'AI办公', '文档处理', '会议纪要',
  '智能写作', 'AI写作', '文案生成', '营销文案',
  '智能编程', 'AI编程', '代码生成', '代码审查',
  '智能翻译', 'AI翻译', '实时翻译',
  '智能搜索', 'AI搜索', '语义搜索', '知识库搜索',
  '智能推荐', '个性化推荐',
  '智能问答', '知识问答', '文档问答',
  '智能语音', '语音识别', '语音合成', '语音克隆',
  '数字人', 'AI主播', '虚拟数字人', '2D数字人', '3D数字人',
  '数字员工', 'AI员工', 'RPA+AI',
  '智能风控', '反欺诈', '信用评估',
  '智能投顾', '量化交易',
  '智能诊断', 'AI辅诊', '医学影像',
  '药物发现', 'AI制药', '蛋白质预测',
  '智能教育', 'AI教育', '自适应学习', 'AI批改',
  '智能司法', 'AI法律', '合同审查', '案例检索',
  '智能安防', 'AI安防', '人脸识别',
  '智能制造', '工业AI', '缺陷检测', '工业视觉',
  '智能驾驶', '自动驾驶', '端到端智驾',
  '智能座舱', '车载AI',
  '智能农业', '智能能源', '智能零售', '智能物流',

  // ── AI 绘画/设计（中文） ──
  'AI绘画', 'AI画图', '文生图', '图生图',
  'AI写真', 'AI头像', '风格迁移',
  'AI设计', 'AI海报',
  'AI视频', '文生视频', '图生视频',
  'AI动画', 'AI短片',
  'AI音乐', 'AI编曲', 'AI唱歌',
  'AI配音', 'AI解说', 'AI播客',
  'ControlNet', 'IP-Adapter', 'InstantID',
  '工作流', 'ComfyUI工作流',
  '提示词', '画图提示词', '正向提示词', '负向提示词',
  '采样器', '采样步数', 'CFG Scale',
  '图生图重绘', 'Inpaint', 'Outpaint', '扩图',
  '老照片修复', '黑白上色', '画质增强', '超分辨率',

  // ── AI 编程/开发（中文） ──
  'AI编程助手', '代码补全', 'AI Debug',
  '低代码', '无代码', '可视化开发',
  'AI测试', '自动化测试', 'AI单元测试',
  '向量数据库', '知识库', '向量检索',
  '模型训练', '分布式训练', '混合精度训练',
  '模型部署', '模型服务化', '在线推理', '离线推理',
  '模型管理', '模型版本', '模型注册',
  '数据标注', '数据清洗', '数据治理',
  '特征工程', '特征存储',
  '实验管理', '实验追踪', '超参搜索',

  // ── AI 硬件/算力（中文） ──
  'GPU服务器', '算力租赁', 'GPU云', '算力平台',
  '国产GPU', '华为昇腾', '昇腾910B', 'CANN', '昇思MindSpore',
  'NPU', 'TPU', 'AI芯片', '推理芯片',
  '模型压缩', '推理加速', 'TensorRT-LLM',
  '显存优化', '内存优化',
  '端侧推理', '移动端部署', 'MNN', 'NCNN',
  '量化工具', '模型转换', 'ONNX导出',
  'AI算力中心', '智算中心', '超算中心',

  // ── 开源社区/项目（中文） ──
  '魔搭社区', 'ModelScope',
  '飞桨社区', '启智社区',
  'AutoDL', 'Gitee AI',
  'HuggingFace中文', '镜像站',
  'LLaMA-Factory中文',
  'ChatGLM开源', 'Qwen开源', 'DeepSeek开源',
  'FastGPT', 'MaxKB', 'Dify中文', 'RAGFlow中文',
  'One-API', 'New-API',
  'ChatGPT-Next-Web', 'LobeChat中文',

  // ── 中文社区热词 ──
  'AI卷', '百模大战', '大模型卷',
  'AI变现', 'AI副业', 'AI赚钱', 'AI创业项目',
  'AI焦虑', 'AI失业', '被AI取代',
  '提示词工程师', 'AI产品经理', 'AI训练师',
  '大模型落地', '行业大模型', '垂直领域大模型',
  '私有化部署', '数据不出域', '信创适配',
  '模型选型', '模型对比', '模型横评', '性价比对比',
  '闭源vs开源', '开源追赶', '国产替代',
  'token消耗', 'API费用', '推理成本',
  '上下文窗口', '长文本支持',
  'Prompt技巧', '提示词模板分享',
  'AI工作流', '自动化工作流', 'Agent工作流',
  'AI学习路径', 'AI入门指南', 'AI进阶',
  '数字人直播', 'AI直播', '无人直播',
  'RPA自动化', 'AI+RPA',
  'AI写论文', 'AI辅助科研', '论文润色',
  'AI做PPT', 'AI做Excel', 'AI总结',
  'AI面试', 'AI刷题', 'AI改简历',

  // ── AI 变现/商业（中文） ──
  '大模型商业模式', 'API定价', '按量计费',
  'AI SaaS', 'AI工具付费', 'AI出海',
  'GPTs商店', 'AI应用商店', 'Agent市场',
  'AI融资', 'AI泡沫',
  'AI PMF', 'AI增长', 'AI留存',
  '降本增效', 'AI增效',
  '数据壁垒', '模型壁垒', '技术护城河',

  // ── AI 学习/教育（中文） ──
  '吴恩达', '李沐', '李宏毅', '动手学深度学习',
  'CS229', 'CS231n', 'CS224n',
  '神经网络入门', '深度学习入门', '机器学习入门', '零基础学AI',
  'Python入门', 'PyTorch教程', 'Transformers教程',
  '论文带读', '论文复现', '论文解读',
  'AI面试题', '大模型面试', '算法面试',
  'AI比赛', 'Kaggle', '天池大赛',
  '学习路线图', 'AI知识图谱', 'AI技能树',
  'AI课程推荐', 'AI书籍推荐',
  '机器学习工程师', '大模型算法岗', '推理优化岗',

  // ── Prompt 工程（中文） ──
  '系统提示词', '角色设定', '人设Prompt',
  '结构化提示词', 'Markdown提示词',
  '逐步思考', '分步推理',
  '给示例', 'Few-shot示例',
  '思维链提示', '零样本思维链',
  '自我一致性', '多数投票',
  '反思提示', '自我修正',
  '角色扮演提示', '专家角色', '多角色对话',
  '输出格式控制', 'JSON输出', '结构化输出',
  'DSPy编程', '提示词自动优化',
  'Prompt注入', '提示词安全', '越狱提示词', '提示词加固',

  // ── RAG/知识增强（中文） ──
  '知识库搭建', 'RAG入门', 'RAG实战', 'RAG踩坑',
  '文档解析', 'PDF解析', '表格解析',
  '文档切分', '语义切分', '段落切分',
  'Embedding模型', 'BGE中文', 'text2vec', 'M3E',
  '向量召回', '混合检索', '多路召回',
  '重排序', 'Reranker', 'BGE-Reranker',
  'RAG评估', 'RAGAS',
  'GraphRAG', '知识图谱RAG', 'LightRAG',
  '多模态RAG', '图片检索',
  'RAG优化', 'HyDE', '查询改写',
  'RAG架构', 'RAG流水线',

  // ── AI Agent（中文） ──
  '智能体', 'AI智能体', 'Agent开发',
  '多Agent', '多智能体协作', 'Agent协作',
  'Agent框架', 'Agent编排', 'Agent工作流',
  '自主Agent', '人机协同Agent',
  '工具调用Agent', '代码执行Agent', '浏览器Agent',
  '记忆模块', 'Agent记忆', '短期记忆', '长期记忆',
  '反思机制', '自我反思Agent',
  '规划Agent', '执行Agent',
  'Multi-Agent辩论', 'Agent评审',
  'Agent安全', 'Agent权限', '沙箱Agent',
  'Agent评测', 'AgentBench',
  'MCP协议', 'Agent通信',
  'Agent落地', '企业Agent', '个人Agent',

  // ── 多模态（中文） ──
  '图文理解', '图片描述', '看图说话', '图片问答',
  '视频理解', '视频摘要', '视频问答',
  '音频理解', '声纹识别',
  '文档理解', 'OCR识别', '公式识别',
  '视觉推理', '空间推理',
  '跨模态检索', '文搜图', '图搜文',
  '多模态对话', '语音对话', '视频对话',
  '端到端多模态', '原生多模态', '全模态',
  '视觉-语言模型', 'VLM能力',

  // ── AI 安全/伦理（中文） ──
  'AI伦理', '算法偏见', '数据偏见', '公平性',
  '隐私保护', '数据脱敏', '差分隐私',
  '模型安全', '对抗攻击', '后门攻击',
  '价值观对齐', '安全对齐', '无害性',
  '内容审核', '敏感词过滤', '合规输出',
  'AI监管', '算法备案', '大模型备案', '生成式AI监管',
  '深度伪造', 'Deepfake', 'AI诈骗', 'AI换脸诈骗',
  'AI版权', '训练数据版权', '生成内容版权',
  '开源合规', '开源协议',

  // ── AI 最新热点/趋势（中文） ──
  '推理模型', 'Reasoning Model', '慢思考',
  '推理时扩展', 'Test-Time Compute',
  'AI搜索', '深度搜索', '搜索增强',
  'AI操作系统', 'AI OS', 'AI native应用',
  'AI浏览器', 'AI眼镜', 'AI耳机',
  '具身智能', '人形机器人', '灵巧手',
  '世界模型', '视频生成世界模型',
  'AI for Science', 'AI4Science',
  'AI编程Agent', '全自动编程', 'AI软件工程师',
  'AI游戏', 'AI NPC', 'AI生成游戏',
  '实时语音', '打断式对话', '全双工语音',
  '长上下文', '无限上下文', '终身记忆',
  '多Agent社会', 'Agent文明',
  'AI短视频', 'AI短剧', 'AI电影',
  '合成数据训练', '自我对弈', '自我进化',
  '端侧大模型', '手机跑大模型', '离线大模型',
  'AI产品经理', 'PM x AI',

  // ── 行业大模型/垂直应用（中文） ──
  '金融大模型', '医疗大模型', '法律大模型', '教育大模型',
  '工业大模型', '政务大模型', '科研大模型',
  '金融AI应用', '智能风控AI', '智能营销AI', '智能投研AI',
  '医疗AI应用', '影像AI', '病理AI',
  '法律AI应用', '合同AI', '法律咨询AI',
  '教育AI应用', '学情分析AI', '精准教学AI',
  '传媒AI应用', 'AI写稿', 'AI剪辑',

  // ── 数据/评测（中文） ──
  '中文数据集', '中文评测', '中文基准',
  'C-Eval', 'CMMLU', 'SuperCLUE', 'FlagEval',
  'OpenCompass', '司南评测',
  'GAOKAO', '高考评测', '法律考试评测',
  '中文对齐评测', '中文安全性评测',
  'Chatbot Arena CN', '中文竞技场',
  '对齐评测', '红队评测', '越狱评测',
  '长文本评测', '大海捞针',
  '幻觉评测', '事实性评测',
  'Agent评测CN', '工具调用评测',
]

/** 排序选项（与后端 sort 参数对齐：latest 最新 / hot 热门） */
export const sortOptions: SortOption[] = [
  { label: '📄 最新', value: 'latest' },
  { label: '🔥 热门', value: 'hot' },
]

/** 分类 slug → 颜色映射 */
export const categoryBadgeMap: Record<string, string> = {
  'general': 'bg-zinc-200 text-zinc-600',
  'llm': 'bg-blue-500/20 text-blue-600',
  'agent': 'bg-purple-500/20 text-purple-600',
  'prompt': 'bg-emerald-500/20 text-emerald-600',
  'art': 'bg-pink-500/20 text-pink-600',
  'opensource': 'bg-amber-500/20 text-amber-600',
  'tools': 'bg-cyan-500/20 text-cyan-600',
  'paper': 'bg-indigo-500/20 text-indigo-600',
  'share': 'bg-rose-500/20 text-rose-600',
}

/** slug → 展示名映射，从 mainCategories 派生 */
const slugToName: Record<string, string> = Object.fromEntries(
  mainCategories.map(c => [c.slug, c.name])
)

/** 分类 slug → 中文展示名（后端 category 字段存的是 slug） */
export function categoryName(slug: string): string {
  return slugToName[slug] || slug
}

/** 根据分类 slug 获取颜色类（后端 category 字段存的是 slug） */
export function categoryBadge(slug: string): string {
  return categoryBadgeMap[slug] || 'bg-zinc-200 text-zinc-600'
}
