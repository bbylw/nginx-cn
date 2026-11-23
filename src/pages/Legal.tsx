import { Link } from "react-router-dom";
import { IconFileText } from "../components/Icons";

export default function Legal() {
  return (
    <section className="lp-utility-page">
      <div className="lp-wrap">
        <div className="lp-legal-wrap">
          <Link to="/" className="lp-link-tertiary">
            返回首页
          </Link>

          <header className="lp-legal-head">
            <span className="lp-kicker">
              <IconFileText size={16} />
              <span>站点说明</span>
            </span>
            <h1 className="lp-h1-utility">隐私、条款与开源许可说明</h1>
            <p className="lp-utility-desc">
              本站点为面向中文开发者的静态技术能力展示与文档参考站点，不含后端账户系统或广告追踪脚本。
            </p>
          </header>

          <div className="lp-legal-grid">
            <article className="lp-legal-card">
              <h2>隐私与本地数据</h2>
              <p>
                本站点不设置追踪 Cookie，不收集个人身份信息，也不向第三方分析平台发送浏览行为日志。点击“复制”按钮时仅在浏览器本地调用剪贴板接口写入所选配置片段。
              </p>
            </article>

            <article className="lp-legal-card">
              <h2>开源许可证与版权归属</h2>
              <p>
                NGINX 软件源码及官方标识依据 BSD 二条款开源许可证发布。本站点整理的中文文档与配置示例用于学习、运维参考与架构选型，不代表 F5 公司或 NGINX 官方商业实体。
              </p>
            </article>

            <article className="lp-legal-card">
              <h2>技术内容与外部链接</h2>
              <p>
                页面中的指令说明、模块索引及官方跳转链接均对应 nginx.org 与 GitHub 官方开源仓库。生产环境变更前，请始终在测试环境使用配置校验命令验证参数兼容性。
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
