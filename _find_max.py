import zipfile, re
z = zipfile.ZipFile(r'D:\codes\tatiana\kamelgraviy-main-max-metrika.zip')
for n in z.namelist():
    if not n.endswith(('.html', '.js')) or 'vendor' in n:
        continue
    t = z.read(n).decode('utf-8', 'replace')
    if 'max.ru' in t.lower() or 'max.svg' in t.lower():
        print('===', n, '===')
        for m in re.finditer(r'.{0,80}max\.ru.{0,120}', t, re.I):
            print(m.group(0).replace('\n', ' '))
