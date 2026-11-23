<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github.com/user-attachments/assets/9335b488-ffcc-4157-8364-2370a0b70ad0">
  <source media="(prefers-color-scheme: light)" srcset="https://github.com/user-attachments/assets/3a7eeb08-1133-47f5-859c-fad4f5a6a013">
  <img alt="NGINX Banner">
</picture>

[![项目状态：活跃 —— 项目已达到稳定、可用的状态，并在持续开发中。](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![社区论坛](https://img.shields.io/badge/community-forum-009639?logo=discourse&link=https%3A%2F%2Fcommunity.nginx.org)](https://community.nginx.org)
[![许可证](https://img.shields.io/badge/License-BSD%202--Clause-blue.svg)](https://github.com/nginx/nginx/blob/master/LICENSE)
[![行为准则](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/nginx/nginx/blob/master/CODE_OF_CONDUCT.md)

NGINX（读作 "engine x" 或 "en-jin-eks"）是全球最流行的 Web 服务器，同时也是高性能的负载均衡器、反向代理、API 网关与内容缓存。

NGINX 是自由开源软件，按简化版的 [2 条款 BSD 类许可证](https://github.com/nginx/nginx/blob/master/LICENSE)分发。

企业级发行版、商业支持与培训由 [F5, Inc](https://www.f5.com/products/nginx) 提供。

> [!IMPORTANT]
> 本 README 的目标是为初次接触 NGINX 的用户提供一份基础、有条理的入门介绍。关于[安装](https://nginx.org/en/docs/install.html)、[构建](https://nginx.org/en/docs/configure.html)、[配置](https://nginx.org/en/docs/dirindex.html)、[调试](https://nginx.org/en/docs/debugging_log.html)等的详细信息，请参阅 [NGINX 完整文档](https://nginx.org/en/docs/)。这些文档页面还包含更详细的[初学者指南](https://nginx.org/en/docs/beginners_guide.html)、各类操作指南、[开发指南](https://nginx.org/en/docs/dev/development_guide.html)，以及完整的模块与[指令参考](https://nginx.org/en/docs/dirindex.html)。

# 目录
- [工作原理](#工作原理)
  - [模块](#模块)
  - [配置文件](#配置文件)
  - [运行时](#运行时)
- [下载与安装](#下载与安装)
  - [Stable 与 Mainline 二进制包](#stable-与-mainline-二进制包)
  - [Linux 二进制安装流程](#linux-二进制安装流程)
  - [FreeBSD 安装流程](#freebsd-安装流程)
  - [Windows 可执行文件](#windows-可执行文件)
  - [动态模块](#动态模块)
- [NGINX 快速上手](#nginx-快速上手)
  - [安装 SSL 证书并启用 TLS 加密](#安装-ssl-证书并启用-tls-加密)
  - [负载均衡](#负载均衡)
  - [限流](#限流)
  - [内容缓存](#内容缓存)
- [从源码构建](#从源码构建)
  - [安装依赖](#安装依赖)
  - [克隆 NGINX GitHub 仓库](#克隆-nginx-github-仓库)
  - [配置构建选项](#配置构建选项)
  - [编译](#编译)
  - [二进制位置与安装](#二进制位置与安装)
  - [运行并测试已安装的二进制](#运行并测试已安装的二进制)
- [提问与问题反馈](#提问与问题反馈)
- [贡献代码](#贡献代码)
- [更多帮助与资源](#更多帮助与资源)
- [更新日志](#更新日志)
- [许可证](#许可证)

# 工作原理

NGINX 是需要安装的软件，为主流操作系统与 Linux 发行版都提供了二进制包。完整的兼容系统清单见[已测试的操作系统与平台](https://nginx.org/en/#tested_os_and_platforms)。

> [!IMPORTANT]
> 尽管几乎所有主流 Linux 发行版都会附带社区版的 nginx，我们仍强烈建议安装并使用官方[软件包](https://nginx.org/en/linux_packages.html)或本仓库的源码。这样做能确保你使用的是最新的发行版或源码，其中包含最新功能、修复与安全补丁。

## 模块

NGINX 由一个个独立模块组成，每个模块通过提供额外的、可配置的功能来扩展核心能力。官方模块的完整清单见 [nginx 文档](https://nginx.org/en/docs/)页面底部的「模块参考」。

NGINX 模块可以按静态模块或动态模块两种形式构建与分发。静态模块在构建时确定，编译后随产物一起进入二进制文件。关于动态模块的工作方式，以及如何获取、安装与配置它们，见[动态模块](#动态模块)。

> [!TIP]
> 执行下面的命令，可以查看你的 NGINX 二进制在构建时包含了哪些静态模块：
```bash
nginx -V
```
> 关于如何把指定的静态模块加入 nginx 构建，见[配置构建选项](#配置构建选项)。

## 配置文件

NGINX 高度灵活且可配置。软件的部署通过纯文本配置文件完成，文件中接受被称为「[指令](https://nginx.org/en/docs/dirindex.html)」的参数。关于 NGINX 配置文件如何运作的完整说明，见[配置文件的结构](https://nginx.org/en/docs/beginners_guide.html#conf_structure)。

> [!NOTE]
> 你的 NGINX 发行版可用的指令集合，取决于它提供了哪些[模块](#模块)。

## 运行时

NGINX 并非以单一的整体进程运行，而是被设计成一组进程的集合，以此突破操作系统对单进程的扩展性限制。这些进程包括：

- 一个「master」进程，负责维护 worker 进程，并读取与解析配置文件。
- 一个或多个「worker」进程，负责处理数据（例如 HTTP 请求）。

[worker 进程](https://nginx.org/en/docs/ngx_core_module.html#worker_processes)的数量在配置文件中定义，可以为给定配置固定下来，也可以自动跟随可用 CPU 核心数调整。多数情况下后者能更好地在可用系统资源之间均摊负载，因为 NGINX 的设计目标就是高效地把工作分摊到所有 worker 进程上。

> [!TIP]
> 进程之间通过共享内存同步数据。正因如此，许多 NGINX 指令需要分配共享内存区域。举例来说，配置[限流](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req)时，需要把接入的客户端记录在一个[公共内存区域](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html#limit_req_zone)里，这样所有 worker 进程都能知道某个客户端在一段时间内访问了服务器多少次。

# 下载与安装

按以下步骤下载并安装预编译的 NGINX 二进制。你也可以选择[从源码本地构建 NGINX](#从源码构建)。

## Stable 与 Mainline 二进制包

NGINX 二进制分两个版本构建与分发：stable 与 mainline。stable 二进制从稳定分支构建，只包含从 mainline 回合（backport）的关键修复。mainline 二进制从 [master 分支](https://github.com/nginx/nginx/tree/master)构建，包含最新功能与缺陷修复。你需要[判断哪种更适合自己的用途](https://docs.nginx.com/nginx/admin-guide/installing-nginx/installing-nginx-open-source/#choosing-between-a-stable-or-a-mainline-version)。

## Linux 二进制安装流程

NGINX 二进制安装流程依托各个 Linux 发行版自带的包管理器。因此首次安装需要先把官方 NGINX 软件源加入系统所用的包管理器。请按[这些步骤](https://nginx.org/en/linux_packages.html)，用适合你的 Linux 发行版的包管理器下载、校验并安装 NGINX 二进制。

### 升级

后续升级到最新版本可以用同一个包管理器完成，无需手动下载并校验二进制。

## FreeBSD 安装流程

在 FreeBSD 系统上安装 NGINX 的更多信息，请访问 <https://nginx.org/en/docs/install.html>。

## Windows 可执行文件

mainline 与 stable 版本的 Windows 可执行文件可在 [NGINX 主下载页](https://nginx.org/en/download.html)找到。请注意，目前 NGINX 的 Windows 实现仍处于概念验证（Proof-of-Concept）阶段，只应用于开发与测试。更多信息请见 [nginx for Windows](https://nginx.org/en/docs/windows.html)。

## 动态模块

NGINX 1.9.11 版本加入了对[动态模块](https://nginx.org/en/docs/ngx_core_module.html#load_module)的支持。与静态模块不同，动态构建的模块可以在核心 NGINX 二进制构建完成之后再下载、安装与配置。[官方动态模块二进制](https://nginx.org/en/linux_packages.html#dynmodules)与前面提到的核心 NGINX 二进制来自同一个软件源。

> [!TIP]
> [NGINX JavaScript（njs）](https://github.com/nginx/njs)是一个广受欢迎的 NGINX 动态模块，它让你可以用熟悉的 JavaScript 语法扩展 NGINX 的核心功能。

> [!IMPORTANT]
> 如有需要，动态模块也可以在编译期以静态方式编译进 NGINX。

# NGINX 快速上手

关于 NGINX 基础知识的入门介绍，请参阅我们的[初学者指南](https://nginx.org/en/docs/beginners_guide.html)。

## 安装 SSL 证书并启用 TLS 加密

关于如何为你的 NGINX 安装启用安全的流量传输，见[配置 HTTPS 服务器](https://nginx.org/en/docs/http/configuring_https_servers.html)快速指南。

## 负载均衡

关于把 NGINX 配置为负载均衡器的快速入门，请参阅[将 nginx 用作 HTTP 负载均衡器](https://nginx.org/en/docs/http/load_balancing.html)。

## 限流

关于把 NGINX 部署为 API 网关的核心概念概览，见我们的博客文章[使用 NGINX 进行限流](https://blog.nginx.org/blog/rate-limiting-nginx)。

## 内容缓存

关于如何把 NGINX 用作内容缓存（例如内容分发网络的边缘服务器），见博客文章[NGINX 与 NGINX Plus 缓存指南](https://blog.nginx.org/blog/nginx-caching-guide)。

# 从源码构建

以下步骤可用于从本仓库的源码构建 NGINX。

## 安装依赖

多数 Linux 发行版需要先安装若干依赖才能构建 NGINX。以下指令针对 `apt` 包管理器，它在大多数 Ubuntu/Debian 发行版及其衍生版上都可以使用。

> [!TIP]
> 在安装新软件包之前，先更新软件源列表始终是个好习惯。
> ```bash
> sudo apt update
> ```

### 安装编译器与 make 工具

使用以下命令安装 GNU C 编译器与 Make 工具。

```bash
sudo apt install gcc make
```

### 安装依赖库

```bash
sudo apt install libpcre3-dev zlib1g-dev
```

> [!WARNING]
> 这是构建具备 rewrite 与 gzip 能力的 NGINX 所需的最小依赖集合。如果你选择编译额外的模块，可能还需要其他依赖。执行后文提到的 `configure` 命令时，请留意它的输出，以了解哪些模块可能缺少依赖。例如，如果你打算用 SSL 证书通过 TLS 加密流量，就需要安装 OpenSSL 库，执行以下命令即可。

>```bash
>sudo apt install libssl-dev

## 克隆 NGINX GitHub 仓库

用你习惯的方式把 NGINX 仓库克隆到开发目录。更多帮助见[克隆 GitHub 仓库](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository)。

```bash
git clone https://github.com/nginx/nginx.git
```

## 配置构建选项

构建 NGINX 之前，必须用[合适的参数](https://nginx.org/en/docs/configure.html)运行 `configure` 脚本。它会在 NGINX 源码根目录生成一个 Makefile，随后即可用它按[配置阶段指定的选项](https://nginx.org/en/docs/configure.html)编译 NGINX。

在 NGINX 源码仓库的根目录下执行：

```bash
auto/configure
```

> [!IMPORTANT]
> 不带任何参数运行 configure 会以默认选项编译 NGINX。完整的可用构建配置选项请见 <https://nginx.org/en/docs/configure.html>。

## 编译

`configure` 脚本执行成功后，会在 NGINX 源码根目录生成一个 `Makefile`。要把 NGINX 编译成二进制，在同一目录下执行以下命令：

```bash
make
```

## 二进制位置与安装

编译成功后，二进制会生成在 `<NGINX_SRC_ROOT_DIR>/objs/nginx`。要安装这个二进制，在源码根目录执行以下命令：

```bash
sudo make install
```

> [!IMPORTANT]
> 二进制会被安装到 `/usr/local/nginx/` 目录。

## 运行并测试已安装的二进制

要运行已安装的二进制，执行以下命令：

```bash
sudo /usr/local/nginx/sbin/nginx
```

你可以用 `curl` 测试 NGINX 是否正常工作。

```bash
curl localhost
```

其输出应当以如下内容开头：

```html
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
```

# 提问与问题反馈

关于如何讨论代码库、提出排查类问题以及反馈 issue，请参阅我们的[支持](https://github.com/nginx/nginx/blob/master/SUPPORT.md)指南。

# 贡献代码

关于如何贡献代码，请参阅[贡献指南](https://github.com/nginx/nginx/blob/master/CONTRIBUTING.md)。

# 更多帮助与资源

- 更多与 NGINX 及相关项目有关的技巧、窍门与操作指南，见 [NGINX 社区博客](https://blog.nginx.org/)。
- 访问 [nginx.org](https://nginx.org/)，它是 NGINX 系列项目的文档、信息与软件的集中来源。

# 更新日志

关注版本更新请见[变更日志](https://nginx.org/en/CHANGES)。

# 许可证

[2 条款 BSD 类许可证](https://github.com/nginx/nginx/blob/master/LICENSE)

---
更多文档见：<https://nginx.org/en/docs>
