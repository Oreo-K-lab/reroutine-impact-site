// RE:ROUTINE is a fictional portfolio case. Edit display figures and notes here.
// Target ratios are derived from current/target, never entered separately.
const number = (value) => new Intl.NumberFormat("ja-JP").format(value);
const percent = (current, target) => `${(current / target * 100).toFixed(1)}%`;

const figures = {
  activeHouseholds: 2480,
  collectedContainers: 18640,
  eligibleContainers: 21425,
  avoidedContainers: 15200,
  averageReuses: 5.4,
  recoveryTarget: 92,
  reuseTarget: 8.0,
  avoidedTarget: 20000,
  productTypes: 3,
  usesPerProduct: 6,
};

const recoveryRate = Math.round(figures.collectedContainers / figures.eligibleContainers * 100);
const annualUses = figures.productTypes * figures.usesPerProduct;
const asOfDate = "2026年8月31日";
const goalDeadline = "2027年3月31日";

export const siteData = {
  activeHouseholds: number(figures.activeHouseholds),
  collectedContainers: number(figures.collectedContainers),
  recoveryRate: String(recoveryRate),
  avoidedContainers: number(figures.avoidedContainers),
  averageReuses: figures.averageReuses.toFixed(1),
  recoveryTarget: String(figures.recoveryTarget),
  reuseTarget: figures.reuseTarget.toFixed(1),
  avoidedTarget: number(figures.avoidedTarget),
  recoveryProgress: percent(recoveryRate, figures.recoveryTarget),
  reuseProgress: percent(figures.averageReuses, figures.reuseTarget),
  avoidedProgress: percent(figures.avoidedContainers, figures.avoidedTarget),
  annualUses: String(annualUses),
  productTypes: String(figures.productTypes),
  usesPerProduct: String(figures.usesPerProduct),
  asOfDate,
  goalDeadline,
  comparisonBasis: `ホームケア製品${figures.productTypes}種をそれぞれ年${figures.usesPerProduct}回購入・補充する、計${annualUses}回分を共通条件とします。`,
  problemNote: `ホームケア製品${figures.productTypes}種をそれぞれ年${figures.usesPerProduct}回購入する場合の、使い捨て方式の想定容器数。`,
  impactNote: `${asOfDate}時点の架空データです。利用世帯は同日時点、回収本数・想定削減本数はサービス開始からの累計。回収率は回収${number(figures.collectedContainers)}本／対象${number(figures.eligibleContainers)}本で算出。`,
  progressNote: `現在値は${asOfDate}時点の架空の想定値。2026年度目標の期限は${goalDeadline}です。`,
  comparisonNote: "比較対象は容器の使用・回収方法です。CO₂・水使用量・エネルギーの削減率は根拠資料がないため示しません。",
  svgComparisonNote: "容器の使用・回収方法の比較です。CO₂・水・エネルギー削減率は、LCAがないため数値化していません。",
  svgProgressNote: "※ ポートフォリオ制作のための架空の想定値です。",
  faqFiguresNote: "いいえ。すべてポートフォリオ制作のために設定した架空の想定値です。",
  canonicalNote: `本サイトは架空ブランドのポートフォリオ作品で、写真・挿絵・図解の制作にAIを利用しています。掲載数値は架空の想定値であり、実在する企業・サービスの実績ではありません。ホームケア製品${figures.productTypes}種をそれぞれ年${figures.usesPerProduct}回購入・補充する計${annualUses}回分を共通条件に、容器の使用・回収方法を比較しています。`,
};
