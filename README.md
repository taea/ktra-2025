# K-tra! The Lightweight Task Tracker - 2025 Edition

- https://taea.github.io/ktra-2025/
- ![ktra-imageonline co-4858461](https://github.com/user-attachments/assets/47eca0db-aae1-48bb-bb70-fd967492175f)
- タスク管理ツールです。各タスクには、Not Started, Doing, Done の状態があり、それぞれアジャイル風なストーリーポイント 0, 1, 2, 3, 5, 8 Point が振れます
- タスク一覧の左側の丸ボタンで、タスク開始や終了ができるようになっています
- 今週の達成状況が可視化できるようになっています
- 11年前に作った Rails + Heroku 製のタスク管理アプリ K-tra を、html + JS + Local Storage のみでバイブコーディングで蘇らせるプロジェクトです
  - https://github.com/taea/ktra
 
# 初期プロンプト

- https://github.com/taea/ktra-2025/blob/main/prompt.md
- 例によってClaude Code にやってもらいました。最初はコード1行も書いてません

# 今後やりたいこと

- デザインスタイルをかっこよくする（2014版に近づけたい）
- ドラッグでタスク優先順位を変更できる
- Due Date を設定して Google Calendar と連携できる

# 感想

- Ktraを蘇らせるのはずっとやりたいと思っていたが、タスク管理は既存アプリを使ってまあまあワークしてたんで、自分で今作って使うのかなーと思って躊躇してたが、使ってるアプリも少し微妙に感じることがあり、これはちょっと改善すればワンチャンあるのではと思って作ってみた
- 既存アプリ確認から初期実装まで、大体5分くらいで終わって相変わらずすごすぎる
- デザイン（スタイル）はねえ……まああんまりかわいくないのだが、ここは自分の領域でもあるので、後でちまちま改善する楽しみにとっておく。UIの構成自体は、オリジナルよりユーザビリティよくなっている気がする。
