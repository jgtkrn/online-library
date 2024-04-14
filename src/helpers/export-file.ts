import { Parser } from 'json2csv';

export class ExportFile {
    async csv(res, fileName, fields, data) {
        const json2csv = new Parser({ fields });
        const csv = json2csv.parse(data);
        res.header('Content-Type', 'text/csv');
        res.attachment(fileName);
        return res.send(csv);
    }
}