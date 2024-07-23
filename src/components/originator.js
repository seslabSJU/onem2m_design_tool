export const setoriginator = {
    setoriginator: {
        setoriginator:{
            type : "text",
            placeholer : 'Shold Start with C or S',
            required : false,
            disable : false,
            value: '',
            validation : function(value){
                if (value[0] != 'C' || value[0] != 'S') return false;
                return ture;
            }
        }
    }
}