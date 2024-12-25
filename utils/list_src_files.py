import os
import pyperclip

def list_files_and_contents(src_path):
    if not os.path.isdir(src_path):
        print(f"指定されたパス '{src_path}' はディレクトリではありません。")
        return ""

    output = ""
    for root, dirs, files in os.walk(src_path):
        for file in files:
            file_path = os.path.join(root, file)
            # 相対パスを表示
            relative_path = os.path.relpath(file_path, src_path)
            output += f"ファイル名: {relative_path}\n"
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                output += "内容:\n"
                output += content + "\n"
            except Exception as e:
                output += f"ファイルを読み込めませんでした: {e}\n"
            output += "-" * 40 + "\n"
    return output

if __name__ == "__main__":
    # リポジトリのルートディレクトリへのパスを指定
    repo_path = "../"  # ここを実際のパスに変更してください
    src_directory = os.path.join(repo_path, "src")
    
    result = list_files_and_contents(src_directory)
    
    if result:
        # 結果をクリップボードにコピー
        try:
            pyperclip.copy(result)
            print("出力がクリップボードにコピーされました。")
        except pyperclip.PyperclipException as e:
            print(f"クリップボードにコピーできませんでした: {e}")
        
        # 任意でコンソールにも出力
        print(result)
